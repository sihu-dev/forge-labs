/**
 * Complete Integration Workflow Example
 * Demonstrates integration between Persana, Apollo, Attio, and n8n
 */

import {
  PersanaClient,
  ApolloClient,
  AttioClient,
  N8nClient,
} from '@forge/integrations';

/**
 * Example: Lead enrichment and CRM sync workflow
 */
async function enrichAndSyncLead(email: string) {
  // Initialize clients
  const persana = new PersanaClient({
    apiKey: process.env.PERSANA_API_KEY!,
  });

  const apollo = new ApolloClient({
    apiKey: process.env.APOLLO_API_KEY!,
  });

  const attio = new AttioClient({
    apiKey: process.env.ATTIO_API_KEY!,
  });

  const n8n = new N8nClient({
    apiKey: process.env.N8N_API_KEY!,
    baseUrl: process.env.N8N_BASE_URL!,
  });

  console.log(`🔍 Enriching lead: ${email}`);

  // Step 1: Enrich person data with Persana
  const personResponse = await persana.enrichPerson({ email });

  if (!personResponse.success) {
    console.error('❌ Persana enrichment failed:', personResponse.error?.message);
    return;
  }

  const person = personResponse.data!;
  console.log(`✅ Enriched: ${person.fullName} at ${person.company}`);

  // Step 2: Verify email with Apollo
  const verificationResponse = await apollo.verifyEmail({ email });

  if (!verificationResponse.success) {
    console.error('❌ Email verification failed:', verificationResponse.error?.message);
    return;
  }

  const verification = verificationResponse.data!;
  console.log(`✅ Email verification: ${verification.status}`);

  if (!verification.is_deliverable) {
    console.warn('⚠️ Email is not deliverable, skipping');
    return;
  }

  // Step 3: Enrich company data
  let company = null;
  if (person.company) {
    const companyResponse = await persana.enrichCompany({
      companyName: person.company,
    });

    if (companyResponse.success) {
      company = companyResponse.data!;
      console.log(`✅ Company enriched: ${company.name} (${company.employees} employees)`);
    }
  }

  // Step 4: Create lead in Attio CRM
  const leadResponse = await attio.createLead({
    email: person.email,
    name: person.fullName,
    title: person.title,
    company: person.company,
    linkedin_url: person.linkedinUrl,
    twitter_url: person.twitterUrl,
    location: person.location,
    bio: person.bio,
    email_status: verification.status,
    company_size: company?.size,
    company_industry: company?.industry,
    company_employees: company?.employees,
  });

  if (!leadResponse.success) {
    console.error('❌ Failed to create lead in Attio:', leadResponse.error?.message);
    return;
  }

  const lead = leadResponse.data!;
  console.log(`✅ Lead created in Attio: ${lead.id.record_id}`);

  // Step 5: Add note to lead
  await attio.createNote({
    data: {
      parent_object: 'leads',
      parent_record_id: lead.id.record_id,
      content: `Lead enriched from Persana AI. Email verified as ${verification.status}.`,
      format: 'plaintext',
    },
  });

  // Step 6: Trigger n8n workflow for follow-up
  const workflowResponse = await n8n.triggerWorkflow('lead-follow-up-workflow', {
    leadId: lead.id.record_id,
    leadEmail: person.email,
    leadName: person.fullName,
    leadTitle: person.title,
    companyName: person.company,
    emailStatus: verification.status,
  });

  if (!workflowResponse.success) {
    console.error('❌ Failed to trigger n8n workflow:', workflowResponse.error?.message);
    return;
  }

  console.log(`✅ n8n workflow triggered: ${workflowResponse.data!.id}`);

  return {
    person,
    verification,
    company,
    lead,
    workflow: workflowResponse.data!,
  };
}

/**
 * Example: Batch lead enrichment
 */
async function batchEnrichLeads(emails: string[]) {
  const persana = new PersanaClient({
    apiKey: process.env.PERSANA_API_KEY!,
  });

  const apollo = new ApolloClient({
    apiKey: process.env.APOLLO_API_KEY!,
  });

  console.log(`🔍 Batch enriching ${emails.length} leads`);

  // Batch enrich with Persana
  const enrichResponse = await persana.batchEnrichPeople(
    emails.map((email) => ({ email }))
  );

  if (!enrichResponse.success) {
    console.error('❌ Batch enrichment failed:', enrichResponse.error?.message);
    return;
  }

  const people = enrichResponse.data!;
  console.log(`✅ Enriched ${people.length} people`);

  // Batch verify emails with Apollo
  const verifyResponse = await apollo.batchVerifyEmails(emails);

  if (!verifyResponse.success) {
    console.error('❌ Batch verification failed:', verifyResponse.error?.message);
    return;
  }

  const verifications = verifyResponse.data!;
  console.log(`✅ Verified ${verifications.length} emails`);

  // Combine results
  const results = people.map((person, index) => ({
    person,
    verification: verifications[index],
  }));

  return results;
}

/**
 * Example: Apollo contact search and Attio sync
 */
async function searchAndSyncContacts() {
  const apollo = new ApolloClient({
    apiKey: process.env.APOLLO_API_KEY!,
  });

  const attio = new AttioClient({
    apiKey: process.env.ATTIO_API_KEY!,
  });

  console.log('🔍 Searching for contacts in Apollo');

  // Search for CEOs in tech companies
  const searchResponse = await apollo.searchContacts({
    person_titles: ['CEO', 'Founder'],
    organization_num_employees_ranges: ['11-50', '51-200'],
    per_page: 50,
  });

  if (!searchResponse.success) {
    console.error('❌ Contact search failed:', searchResponse.error?.message);
    return;
  }

  const contacts = searchResponse.data!;
  console.log(`✅ Found ${contacts.length} contacts`);

  // Sync to Attio
  const syncedLeads = [];
  for (const contact of contacts) {
    if (contact.email_status !== 'verified') {
      console.log(`⏭️ Skipping ${contact.email} (not verified)`);
      continue;
    }

    const leadResponse = await attio.createLead({
      email: contact.email,
      name: contact.name,
      title: contact.title,
      company: contact.organization.name,
      linkedin_url: contact.linkedin_url,
      city: contact.city,
      state: contact.state,
      country: contact.country,
      company_website: contact.organization.website_url,
      company_employees: contact.organization.estimated_num_employees,
      company_industry: contact.organization.industry,
    });

    if (leadResponse.success) {
      syncedLeads.push(leadResponse.data!);
      console.log(`✅ Synced: ${contact.name}`);
    }

    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(`✅ Synced ${syncedLeads.length} leads to Attio`);

  return syncedLeads;
}

/**
 * Example: n8n workflow orchestration
 */
async function orchestrateLeadWorkflow(leadData: {
  email: string;
  name: string;
  company: string;
}) {
  const n8n = new N8nClient({
    apiKey: process.env.N8N_API_KEY!,
    baseUrl: process.env.N8N_BASE_URL!,
  });

  console.log('🚀 Orchestrating lead workflow');

  // Trigger main workflow
  const executionResponse = await n8n.triggerWorkflow('main-lead-workflow', leadData);

  if (!executionResponse.success) {
    console.error('❌ Workflow trigger failed:', executionResponse.error?.message);
    return;
  }

  const execution = executionResponse.data!;
  console.log(`✅ Workflow started: ${execution.id}`);

  // Wait for completion
  console.log('⏳ Waiting for workflow to complete...');
  const completedResponse = await n8n.waitForExecution(execution.id, {
    maxWaitTime: 120000, // 2 minutes
    pollInterval: 3000, // 3 seconds
  });

  if (!completedResponse.success) {
    console.error('❌ Workflow execution failed:', completedResponse.error?.message);
    return;
  }

  const completed = completedResponse.data!;

  if (completed.status === 'success') {
    console.log('✅ Workflow completed successfully');
  } else if (completed.status === 'error') {
    console.error('❌ Workflow failed:', completed.data?.resultData?.error?.message);
  }

  return completed;
}

/**
 * Example: Attio webhook handler
 */
async function handleAttioWebhook(payload: string, signature: string) {
  const attio = new AttioClient({
    apiKey: process.env.ATTIO_API_KEY!,
  });

  const n8n = new N8nClient({
    apiKey: process.env.N8N_API_KEY!,
    baseUrl: process.env.N8N_BASE_URL!,
  });

  // Verify webhook signature
  const isValid = attio.verifyWebhookSignature(
    payload,
    signature,
    process.env.ATTIO_WEBHOOK_SECRET!
  );

  if (!isValid) {
    console.error('❌ Invalid webhook signature');
    return;
  }

  // Parse event
  const event = attio.parseWebhookEvent(payload);
  console.log(`📨 Webhook received: ${event.type}`);

  // Handle different event types
  if (event.type === 'record.created' && event.object_id === 'leads') {
    // New lead created, trigger enrichment workflow
    await n8n.triggerWorkflow('lead-enrichment-workflow', {
      leadId: event.record_id,
    });

    console.log('✅ Triggered enrichment workflow for new lead');
  } else if (event.type === 'record.updated' && event.object_id === 'deals') {
    // Deal updated, trigger notification workflow
    await n8n.triggerWorkflow('deal-notification-workflow', {
      dealId: event.record_id,
    });

    console.log('✅ Triggered notification workflow for updated deal');
  }
}

// Export examples
export {
  enrichAndSyncLead,
  batchEnrichLeads,
  searchAndSyncContacts,
  orchestrateLeadWorkflow,
  handleAttioWebhook,
};
