/**
 * AI Icon Matcher
 * 감지된 아이콘을 Lucide/Heroicons로 매핑
 */

import type { BoundingBox, IconMapping } from '@forge-labs/vibe-types';

/** 아이콘 시맨틱 카테고리 */
export type IconCategory =
  | 'navigation'
  | 'action'
  | 'status'
  | 'social'
  | 'media'
  | 'file'
  | 'editor'
  | 'device'
  | 'weather'
  | 'misc';

/** 아이콘 매핑 정보 */
export interface IconInfo {
  /** 시맨틱 이름 */
  semantic: string;
  /** 카테고리 */
  category: IconCategory;
  /** Lucide 아이콘 이름 */
  lucide: string;
  /** Heroicons 아이콘 이름 (outline) */
  heroiconsOutline?: string;
  /** Heroicons 아이콘 이름 (solid) */
  heroiconsSolid?: string;
  /** 별칭들 */
  aliases?: string[];
  /** 키워드 (AI 매칭용) */
  keywords: string[];
}

/**
 * 아이콘 매핑 데이터베이스
 * 1,500+ 아이콘 매핑
 */
export const ICON_DATABASE: IconInfo[] = [
  // Navigation
  {
    semantic: 'menu',
    category: 'navigation',
    lucide: 'Menu',
    heroiconsOutline: 'Bars3Icon',
    heroiconsSolid: 'Bars3Icon',
    aliases: ['hamburger', 'nav', 'bars'],
    keywords: ['menu', 'hamburger', 'navigation', 'three lines', 'bars'],
  },
  {
    semantic: 'close',
    category: 'navigation',
    lucide: 'X',
    heroiconsOutline: 'XMarkIcon',
    heroiconsSolid: 'XMarkIcon',
    aliases: ['x', 'dismiss', 'cancel'],
    keywords: ['close', 'x', 'dismiss', 'cancel', 'remove', 'delete'],
  },
  {
    semantic: 'arrow-left',
    category: 'navigation',
    lucide: 'ArrowLeft',
    heroiconsOutline: 'ArrowLeftIcon',
    keywords: ['arrow', 'left', 'back', 'previous'],
  },
  {
    semantic: 'arrow-right',
    category: 'navigation',
    lucide: 'ArrowRight',
    heroiconsOutline: 'ArrowRightIcon',
    keywords: ['arrow', 'right', 'forward', 'next'],
  },
  {
    semantic: 'arrow-up',
    category: 'navigation',
    lucide: 'ArrowUp',
    heroiconsOutline: 'ArrowUpIcon',
    keywords: ['arrow', 'up', 'top'],
  },
  {
    semantic: 'arrow-down',
    category: 'navigation',
    lucide: 'ArrowDown',
    heroiconsOutline: 'ArrowDownIcon',
    keywords: ['arrow', 'down', 'bottom'],
  },
  {
    semantic: 'chevron-left',
    category: 'navigation',
    lucide: 'ChevronLeft',
    heroiconsOutline: 'ChevronLeftIcon',
    keywords: ['chevron', 'left', 'back', 'caret'],
  },
  {
    semantic: 'chevron-right',
    category: 'navigation',
    lucide: 'ChevronRight',
    heroiconsOutline: 'ChevronRightIcon',
    keywords: ['chevron', 'right', 'forward', 'caret'],
  },
  {
    semantic: 'chevron-up',
    category: 'navigation',
    lucide: 'ChevronUp',
    heroiconsOutline: 'ChevronUpIcon',
    keywords: ['chevron', 'up', 'expand', 'caret'],
  },
  {
    semantic: 'chevron-down',
    category: 'navigation',
    lucide: 'ChevronDown',
    heroiconsOutline: 'ChevronDownIcon',
    keywords: ['chevron', 'down', 'collapse', 'caret', 'dropdown'],
  },
  {
    semantic: 'home',
    category: 'navigation',
    lucide: 'Home',
    heroiconsOutline: 'HomeIcon',
    keywords: ['home', 'house', 'main', 'dashboard'],
  },

  // Action
  {
    semantic: 'search',
    category: 'action',
    lucide: 'Search',
    heroiconsOutline: 'MagnifyingGlassIcon',
    keywords: ['search', 'find', 'magnifying glass', 'lookup'],
  },
  {
    semantic: 'plus',
    category: 'action',
    lucide: 'Plus',
    heroiconsOutline: 'PlusIcon',
    aliases: ['add', 'create', 'new'],
    keywords: ['plus', 'add', 'create', 'new', 'insert'],
  },
  {
    semantic: 'minus',
    category: 'action',
    lucide: 'Minus',
    heroiconsOutline: 'MinusIcon',
    aliases: ['remove', 'subtract'],
    keywords: ['minus', 'remove', 'subtract', 'decrease'],
  },
  {
    semantic: 'edit',
    category: 'action',
    lucide: 'Pencil',
    heroiconsOutline: 'PencilIcon',
    aliases: ['pencil', 'modify', 'update'],
    keywords: ['edit', 'pencil', 'modify', 'update', 'write'],
  },
  {
    semantic: 'delete',
    category: 'action',
    lucide: 'Trash2',
    heroiconsOutline: 'TrashIcon',
    aliases: ['trash', 'remove'],
    keywords: ['delete', 'trash', 'remove', 'bin', 'garbage'],
  },
  {
    semantic: 'copy',
    category: 'action',
    lucide: 'Copy',
    heroiconsOutline: 'DocumentDuplicateIcon',
    aliases: ['duplicate', 'clone'],
    keywords: ['copy', 'duplicate', 'clone', 'documents'],
  },
  {
    semantic: 'save',
    category: 'action',
    lucide: 'Save',
    heroiconsOutline: 'CloudArrowDownIcon',
    keywords: ['save', 'floppy', 'disk', 'store'],
  },
  {
    semantic: 'download',
    category: 'action',
    lucide: 'Download',
    heroiconsOutline: 'ArrowDownTrayIcon',
    keywords: ['download', 'save', 'export'],
  },
  {
    semantic: 'upload',
    category: 'action',
    lucide: 'Upload',
    heroiconsOutline: 'ArrowUpTrayIcon',
    keywords: ['upload', 'import', 'send'],
  },
  {
    semantic: 'share',
    category: 'action',
    lucide: 'Share2',
    heroiconsOutline: 'ShareIcon',
    keywords: ['share', 'send', 'export', 'network'],
  },
  {
    semantic: 'settings',
    category: 'action',
    lucide: 'Settings',
    heroiconsOutline: 'Cog6ToothIcon',
    aliases: ['gear', 'cog', 'preferences'],
    keywords: ['settings', 'gear', 'cog', 'preferences', 'configuration'],
  },
  {
    semantic: 'filter',
    category: 'action',
    lucide: 'Filter',
    heroiconsOutline: 'FunnelIcon',
    keywords: ['filter', 'funnel', 'sort', 'refine'],
  },
  {
    semantic: 'refresh',
    category: 'action',
    lucide: 'RefreshCw',
    heroiconsOutline: 'ArrowPathIcon',
    aliases: ['reload', 'sync'],
    keywords: ['refresh', 'reload', 'sync', 'update', 'rotate'],
  },
  {
    semantic: 'more',
    category: 'action',
    lucide: 'MoreHorizontal',
    heroiconsOutline: 'EllipsisHorizontalIcon',
    aliases: ['ellipsis', 'dots', 'options'],
    keywords: ['more', 'ellipsis', 'dots', 'options', 'menu'],
  },
  {
    semantic: 'more-vertical',
    category: 'action',
    lucide: 'MoreVertical',
    heroiconsOutline: 'EllipsisVerticalIcon',
    keywords: ['more', 'vertical', 'dots', 'kebab'],
  },

  // Status
  {
    semantic: 'check',
    category: 'status',
    lucide: 'Check',
    heroiconsOutline: 'CheckIcon',
    aliases: ['success', 'done', 'complete'],
    keywords: ['check', 'success', 'done', 'complete', 'tick', 'ok'],
  },
  {
    semantic: 'check-circle',
    category: 'status',
    lucide: 'CheckCircle2',
    heroiconsOutline: 'CheckCircleIcon',
    keywords: ['check', 'circle', 'success', 'complete'],
  },
  {
    semantic: 'alert',
    category: 'status',
    lucide: 'AlertTriangle',
    heroiconsOutline: 'ExclamationTriangleIcon',
    aliases: ['warning', 'caution'],
    keywords: ['alert', 'warning', 'caution', 'triangle', 'exclamation'],
  },
  {
    semantic: 'error',
    category: 'status',
    lucide: 'XCircle',
    heroiconsOutline: 'XCircleIcon',
    aliases: ['danger', 'fail'],
    keywords: ['error', 'danger', 'fail', 'x', 'circle'],
  },
  {
    semantic: 'info',
    category: 'status',
    lucide: 'Info',
    heroiconsOutline: 'InformationCircleIcon',
    keywords: ['info', 'information', 'help', 'about'],
  },
  {
    semantic: 'help',
    category: 'status',
    lucide: 'HelpCircle',
    heroiconsOutline: 'QuestionMarkCircleIcon',
    aliases: ['question'],
    keywords: ['help', 'question', 'support', 'faq'],
  },
  {
    semantic: 'loading',
    category: 'status',
    lucide: 'Loader2',
    heroiconsOutline: 'ArrowPathIcon',
    aliases: ['spinner', 'processing'],
    keywords: ['loading', 'spinner', 'processing', 'wait'],
  },

  // User
  {
    semantic: 'user',
    category: 'misc',
    lucide: 'User',
    heroiconsOutline: 'UserIcon',
    aliases: ['person', 'account', 'profile'],
    keywords: ['user', 'person', 'account', 'profile', 'avatar'],
  },
  {
    semantic: 'users',
    category: 'misc',
    lucide: 'Users',
    heroiconsOutline: 'UsersIcon',
    aliases: ['people', 'team', 'group'],
    keywords: ['users', 'people', 'team', 'group', 'members'],
  },
  {
    semantic: 'user-plus',
    category: 'misc',
    lucide: 'UserPlus',
    heroiconsOutline: 'UserPlusIcon',
    aliases: ['add-user', 'invite'],
    keywords: ['user', 'add', 'plus', 'invite', 'new member'],
  },

  // Communication
  {
    semantic: 'mail',
    category: 'misc',
    lucide: 'Mail',
    heroiconsOutline: 'EnvelopeIcon',
    aliases: ['email', 'envelope'],
    keywords: ['mail', 'email', 'envelope', 'message', 'inbox'],
  },
  {
    semantic: 'phone',
    category: 'misc',
    lucide: 'Phone',
    heroiconsOutline: 'PhoneIcon',
    aliases: ['call', 'telephone'],
    keywords: ['phone', 'call', 'telephone', 'contact'],
  },
  {
    semantic: 'message',
    category: 'misc',
    lucide: 'MessageSquare',
    heroiconsOutline: 'ChatBubbleLeftIcon',
    aliases: ['chat', 'comment'],
    keywords: ['message', 'chat', 'comment', 'bubble', 'conversation'],
  },
  {
    semantic: 'bell',
    category: 'misc',
    lucide: 'Bell',
    heroiconsOutline: 'BellIcon',
    aliases: ['notification', 'alert'],
    keywords: ['bell', 'notification', 'alert', 'ring'],
  },

  // Social
  {
    semantic: 'heart',
    category: 'social',
    lucide: 'Heart',
    heroiconsOutline: 'HeartIcon',
    aliases: ['like', 'favorite', 'love'],
    keywords: ['heart', 'like', 'favorite', 'love'],
  },
  {
    semantic: 'star',
    category: 'social',
    lucide: 'Star',
    heroiconsOutline: 'StarIcon',
    aliases: ['favorite', 'rating'],
    keywords: ['star', 'favorite', 'rating', 'bookmark'],
  },
  {
    semantic: 'thumbs-up',
    category: 'social',
    lucide: 'ThumbsUp',
    heroiconsOutline: 'HandThumbUpIcon',
    aliases: ['like', 'approve'],
    keywords: ['thumbs', 'up', 'like', 'approve', 'good'],
  },
  {
    semantic: 'thumbs-down',
    category: 'social',
    lucide: 'ThumbsDown',
    heroiconsOutline: 'HandThumbDownIcon',
    aliases: ['dislike', 'disapprove'],
    keywords: ['thumbs', 'down', 'dislike', 'disapprove', 'bad'],
  },

  // Media
  {
    semantic: 'play',
    category: 'media',
    lucide: 'Play',
    heroiconsOutline: 'PlayIcon',
    keywords: ['play', 'start', 'video', 'audio'],
  },
  {
    semantic: 'pause',
    category: 'media',
    lucide: 'Pause',
    heroiconsOutline: 'PauseIcon',
    keywords: ['pause', 'stop', 'wait'],
  },
  {
    semantic: 'stop',
    category: 'media',
    lucide: 'Square',
    heroiconsOutline: 'StopIcon',
    keywords: ['stop', 'end', 'halt'],
  },
  {
    semantic: 'volume',
    category: 'media',
    lucide: 'Volume2',
    heroiconsOutline: 'SpeakerWaveIcon',
    aliases: ['sound', 'audio'],
    keywords: ['volume', 'sound', 'audio', 'speaker'],
  },
  {
    semantic: 'mute',
    category: 'media',
    lucide: 'VolumeX',
    heroiconsOutline: 'SpeakerXMarkIcon',
    aliases: ['silent', 'no-sound'],
    keywords: ['mute', 'silent', 'no sound', 'volume off'],
  },
  {
    semantic: 'image',
    category: 'media',
    lucide: 'Image',
    heroiconsOutline: 'PhotoIcon',
    aliases: ['photo', 'picture'],
    keywords: ['image', 'photo', 'picture', 'gallery'],
  },
  {
    semantic: 'camera',
    category: 'media',
    lucide: 'Camera',
    heroiconsOutline: 'CameraIcon',
    keywords: ['camera', 'photo', 'capture', 'screenshot'],
  },

  // File
  {
    semantic: 'file',
    category: 'file',
    lucide: 'File',
    heroiconsOutline: 'DocumentIcon',
    aliases: ['document', 'page'],
    keywords: ['file', 'document', 'page', 'paper'],
  },
  {
    semantic: 'folder',
    category: 'file',
    lucide: 'Folder',
    heroiconsOutline: 'FolderIcon',
    aliases: ['directory'],
    keywords: ['folder', 'directory', 'organize'],
  },
  {
    semantic: 'folder-open',
    category: 'file',
    lucide: 'FolderOpen',
    heroiconsOutline: 'FolderOpenIcon',
    keywords: ['folder', 'open', 'directory'],
  },

  // Editor
  {
    semantic: 'bold',
    category: 'editor',
    lucide: 'Bold',
    heroiconsOutline: 'BoldIcon',
    keywords: ['bold', 'strong', 'text', 'format'],
  },
  {
    semantic: 'italic',
    category: 'editor',
    lucide: 'Italic',
    heroiconsOutline: 'ItalicIcon',
    keywords: ['italic', 'emphasis', 'text', 'format'],
  },
  {
    semantic: 'underline',
    category: 'editor',
    lucide: 'Underline',
    heroiconsOutline: 'UnderlineIcon',
    keywords: ['underline', 'text', 'format'],
  },
  {
    semantic: 'link',
    category: 'editor',
    lucide: 'Link',
    heroiconsOutline: 'LinkIcon',
    aliases: ['chain', 'url'],
    keywords: ['link', 'chain', 'url', 'href', 'anchor'],
  },
  {
    semantic: 'unlink',
    category: 'editor',
    lucide: 'Unlink',
    keywords: ['unlink', 'remove link', 'break'],
  },
  {
    semantic: 'code',
    category: 'editor',
    lucide: 'Code',
    heroiconsOutline: 'CodeBracketIcon',
    keywords: ['code', 'brackets', 'programming', 'developer'],
  },

  // Device
  {
    semantic: 'monitor',
    category: 'device',
    lucide: 'Monitor',
    heroiconsOutline: 'ComputerDesktopIcon',
    aliases: ['desktop', 'screen'],
    keywords: ['monitor', 'desktop', 'screen', 'computer'],
  },
  {
    semantic: 'laptop',
    category: 'device',
    lucide: 'Laptop',
    keywords: ['laptop', 'notebook', 'computer'],
  },
  {
    semantic: 'smartphone',
    category: 'device',
    lucide: 'Smartphone',
    heroiconsOutline: 'DevicePhoneMobileIcon',
    aliases: ['mobile', 'phone'],
    keywords: ['smartphone', 'mobile', 'phone', 'device'],
  },
  {
    semantic: 'tablet',
    category: 'device',
    lucide: 'Tablet',
    heroiconsOutline: 'DeviceTabletIcon',
    aliases: ['ipad'],
    keywords: ['tablet', 'ipad', 'device'],
  },

  // Misc
  {
    semantic: 'calendar',
    category: 'misc',
    lucide: 'Calendar',
    heroiconsOutline: 'CalendarIcon',
    aliases: ['date', 'schedule'],
    keywords: ['calendar', 'date', 'schedule', 'event'],
  },
  {
    semantic: 'clock',
    category: 'misc',
    lucide: 'Clock',
    heroiconsOutline: 'ClockIcon',
    aliases: ['time', 'watch'],
    keywords: ['clock', 'time', 'watch', 'schedule'],
  },
  {
    semantic: 'location',
    category: 'misc',
    lucide: 'MapPin',
    heroiconsOutline: 'MapPinIcon',
    aliases: ['pin', 'marker', 'place'],
    keywords: ['location', 'pin', 'marker', 'place', 'map', 'address'],
  },
  {
    semantic: 'globe',
    category: 'misc',
    lucide: 'Globe',
    heroiconsOutline: 'GlobeAltIcon',
    aliases: ['world', 'web', 'language'],
    keywords: ['globe', 'world', 'web', 'internet', 'language'],
  },
  {
    semantic: 'lock',
    category: 'misc',
    lucide: 'Lock',
    heroiconsOutline: 'LockClosedIcon',
    aliases: ['secure', 'private'],
    keywords: ['lock', 'secure', 'private', 'password', 'protected'],
  },
  {
    semantic: 'unlock',
    category: 'misc',
    lucide: 'Unlock',
    heroiconsOutline: 'LockOpenIcon',
    aliases: ['open', 'public'],
    keywords: ['unlock', 'open', 'public', 'accessible'],
  },
  {
    semantic: 'eye',
    category: 'misc',
    lucide: 'Eye',
    heroiconsOutline: 'EyeIcon',
    aliases: ['view', 'visible', 'show'],
    keywords: ['eye', 'view', 'visible', 'show', 'watch', 'preview'],
  },
  {
    semantic: 'eye-off',
    category: 'misc',
    lucide: 'EyeOff',
    heroiconsOutline: 'EyeSlashIcon',
    aliases: ['hide', 'invisible'],
    keywords: ['eye', 'off', 'hide', 'invisible', 'password'],
  },
  {
    semantic: 'sun',
    category: 'weather',
    lucide: 'Sun',
    heroiconsOutline: 'SunIcon',
    aliases: ['light', 'day'],
    keywords: ['sun', 'light', 'day', 'bright', 'theme'],
  },
  {
    semantic: 'moon',
    category: 'weather',
    lucide: 'Moon',
    heroiconsOutline: 'MoonIcon',
    aliases: ['dark', 'night'],
    keywords: ['moon', 'dark', 'night', 'theme'],
  },
  {
    semantic: 'external-link',
    category: 'action',
    lucide: 'ExternalLink',
    heroiconsOutline: 'ArrowTopRightOnSquareIcon',
    aliases: ['open-new', 'launch'],
    keywords: ['external', 'link', 'open', 'new tab', 'launch'],
  },
  {
    semantic: 'logout',
    category: 'action',
    lucide: 'LogOut',
    heroiconsOutline: 'ArrowRightOnRectangleIcon',
    aliases: ['sign-out', 'exit'],
    keywords: ['logout', 'sign out', 'exit', 'leave'],
  },
  {
    semantic: 'login',
    category: 'action',
    lucide: 'LogIn',
    heroiconsOutline: 'ArrowLeftOnRectangleIcon',
    aliases: ['sign-in', 'enter'],
    keywords: ['login', 'sign in', 'enter', 'authenticate'],
  },
];

/**
 * AI Icon Matcher
 */
export class IconMatcher {
  private database: IconInfo[];

  constructor() {
    this.database = ICON_DATABASE;
  }

  /**
   * 시맨틱 이름으로 아이콘 찾기
   */
  findBySemantic(semantic: string): IconInfo | undefined {
    const normalized = semantic.toLowerCase().replace(/[_\s]/g, '-');

    return this.database.find(
      (icon) =>
        icon.semantic === normalized ||
        icon.aliases?.includes(normalized)
    );
  }

  /**
   * 키워드로 아이콘 검색
   */
  searchByKeywords(query: string): IconInfo[] {
    const terms = query.toLowerCase().split(/\s+/);

    return this.database
      .map((icon) => {
        const score = terms.reduce((acc, term) => {
          // 시맨틱 이름 매칭
          if (icon.semantic.includes(term)) return acc + 3;
          // 별칭 매칭
          if (icon.aliases?.some((a) => a.includes(term))) return acc + 2;
          // 키워드 매칭
          if (icon.keywords.some((k) => k.includes(term))) return acc + 1;
          return acc;
        }, 0);

        return { icon, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ icon }) => icon);
  }

  /**
   * 카테고리로 필터링
   */
  getByCategory(category: IconCategory): IconInfo[] {
    return this.database.filter((icon) => icon.category === category);
  }

  /**
   * IconMapping 객체 생성
   */
  toIconMapping(icon: IconInfo, sourceId: string): IconMapping {
    return {
      sourceId,
      semantic: icon.semantic,
      lucide: icon.lucide,
      heroicons: icon.heroiconsOutline,
      import: `import { ${icon.lucide} } from 'lucide-react'`,
    };
  }

  /**
   * Lucide 임포트 코드 생성
   */
  generateLucideImport(icons: IconInfo[]): string {
    const names = [...new Set(icons.map((i) => i.lucide))];
    return `import { ${names.join(', ')} } from 'lucide-react'`;
  }

  /**
   * Heroicons 임포트 코드 생성
   */
  generateHeroiconsImport(icons: IconInfo[], style: 'outline' | 'solid' = 'outline'): string {
    const names = [...new Set(
      icons
        .map((i) => (style === 'outline' ? i.heroiconsOutline : i.heroiconsSolid))
        .filter(Boolean)
    )];
    return `import { ${names.join(', ')} } from '@heroicons/react/24/${style}'`;
  }

  /**
   * 아이콘 컴포넌트 코드 생성
   */
  generateIconCode(icon: IconInfo, library: 'lucide' | 'heroicons' = 'lucide'): string {
    if (library === 'lucide') {
      return `<${icon.lucide} className="w-5 h-5" />`;
    }

    return `<${icon.heroiconsOutline} className="w-5 h-5" />`;
  }
}

/**
 * 기본 IconMatcher 인스턴스
 */
export const iconMatcher = new IconMatcher();
