export type QuestThemeStyle = Record<string, string>;

const DEFAULT_QUEST_THEME: QuestThemeStyle = {
  '--quest-bg': '#9aa3ad',
  '--quest-shadow': '#707984',
  '--quest-top-light': '#c8ced6',
};

const QUEST_THEMES: Record<string, QuestThemeStyle> = {
  CHECKBOX: {
    '--quest-bg': '#66d575',
    '--quest-shadow': '#159E67',
    '--quest-top-light': '#76ea85',
  },
  MINIGAME: {
    '--quest-bg': '#3fa8f5',
    '--quest-shadow': '#4b66df',
    '--quest-top-light': '#83caff',
  },
  COLLABORATIVE: {
    '--quest-bg': '#ffc44d',
    '--quest-shadow': '#d9901f',
    '--quest-top-light': '#ffe079',
  },
};

const QUEST_ICONS: Record<string, string> = {
  CHECKBOX: '/assets/images/quests/checkbox.png',
  MINIGAME: '/assets/images/quests/game.png',
  COLLABORATIVE: '/assets/images/quests/colab.png',
};

export function getQuestDisplayType(questType: string, themeType: string): string {
  return questType === 'COLLABORATIVE' ? 'COLLABORATIVE' : themeType;
}

export function getQuestTypeTheme(type: string): QuestThemeStyle {
  return QUEST_THEMES[type.toUpperCase()] ?? DEFAULT_QUEST_THEME;
}

export function getQuestTypeIcon(type: string): string {
  return QUEST_ICONS[type.toUpperCase()] ?? QUEST_ICONS['CHECKBOX'];
}
