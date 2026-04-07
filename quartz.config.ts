import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

const config: QuartzConfig = {
  configuration: {
    pageTitle: "My Digital Garden",
    enableSPA: true,
    enablePopovers: true,
    analytics: null,
    baseUrl: "zhongli0226.github.io",
    ignorePatterns: [
      "private",
      ".obsidian",
      "**/📄 Templates/**",
    ],
    defaultDateType: "created",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "Schibsted Grotesk",
        body: "Source Sans Pro",
        code: "IBM Plex Mono",
      },
      colors: {
        lightMode: {
          light: "#faf8f8",
          lightgray: "#bfbfbf",
          gray: "#808080",
          darkgray: "#4e4e4e",
          dark: "#2b2b2b",
          secondary: "#d4577a",
          tertiary: "#e8799a",
          highlight: "rgba(212, 87, 122, 0.1)",
          textHighlight: "#fff23688",
        },
        darkMode: {
          light: "#161618",
          lightgray: "#4a474a",
          gray: "#8a8a8a",
          darkgray: "#d4d4d4",
          dark: "#ebebec",
          secondary: "#e8799a",
          tertiary: "#f2a0b5",
          highlight: "rgba(232, 121, 154, 0.12)",
          textHighlight: "#b3aa0288",
        },
      },
    },
    locale: "en-US",
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate(),
      Plugin.SyntaxHighlighting(),
      Plugin.ObsidianFlavoredMarkdown(),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex(),
    ],
    filters: [
      Plugin.RemoveDrafts(),
    ],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex(),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.NotFoundPage(),
    ],
  },
}

export default config
