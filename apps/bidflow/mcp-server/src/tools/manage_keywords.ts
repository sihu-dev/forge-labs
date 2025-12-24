import { z } from 'zod';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { getSupabaseClient } from '../lib/supabase.js';

// Add Keyword
const AddKeywordInputSchema = z.object({
  keyword: z.string().min(1),
  category: z.string().optional(),
});

export const addKeywordTool: Tool = {
  name: 'add_keyword',
  description: 'Add a keyword to the bid search tracking list',
  inputSchema: {
    type: 'object',
    properties: {
      keyword: { type: 'string', minLength: 1 },
      category: { type: 'string' },
    },
    required: ['keyword'],
  },
};

export async function handleAddKeyword(args: unknown) {
  const input = AddKeywordInputSchema.parse(args);
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('tracked_keywords')
    .insert({ keyword: input.keyword, category: input.category })
    .select()
    .single();

  if (error) throw new Error(`Failed to add keyword: ${error.message}`);
  return { success: true, keyword: data };
}

// Remove Keyword
const RemoveKeywordInputSchema = z.object({
  keyword: z.string().min(1),
});

export const removeKeywordTool: Tool = {
  name: 'remove_keyword',
  description: 'Remove a keyword from the bid search tracking list',
  inputSchema: {
    type: 'object',
    properties: {
      keyword: { type: 'string', minLength: 1 },
    },
    required: ['keyword'],
  },
};

export async function handleRemoveKeyword(args: unknown) {
  const input = RemoveKeywordInputSchema.parse(args);
  const supabase = getSupabaseClient();

  const { error } = await supabase.from('tracked_keywords').delete().eq('keyword', input.keyword);

  if (error) throw new Error(`Failed to remove keyword: ${error.message}`);
  return { success: true, keyword: input.keyword, status: 'removed' };
}

// Get Keywords
export const getKeywordsTool: Tool = {
  name: 'get_keywords',
  description: 'List all tracked keywords',
  inputSchema: {
    type: 'object',
    properties: {},
  },
};

export async function handleGetKeywords() {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.from('tracked_keywords').select('*').order('keyword');

  if (error) throw new Error(`Failed to fetch keywords: ${error.message}`);
  return { keywords: data || [] };
}
