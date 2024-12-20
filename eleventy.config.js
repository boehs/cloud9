import postcss from "postcss";
import postcsso from "postcss-csso";
import { build as esbuild } from "esbuild";
import { minify as minifyHtml } from "html-minifier";
import { minify as minifyTs } from "terser";
import * as sass from "sass";
import path from "path";
import pluginIcons from "eleventy-plugin-icons";

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ _public: "/" });
  eleventyConfig.addFilter("dropContentFolder", (path, folder) =>
    path.replace(new RegExp(folder + "/"), "")
  );

  eleventyConfig.addTemplateFormats("scss");
  eleventyConfig.addExtension("scss", {
    outputFileExtension: "css",
    compile: async function (inputContent, inputPath) {
      if (inputPath.split("/").at(-1).startsWith("_")) return;

      let { css, loadedUrls } = sass.compileString(inputContent, {
        loadPaths: [path.parse(inputPath).dir || "."],
        sourceMap: false,
      });

      this.addDependencies(inputPath, loadedUrls);

      return async () => {
        const { content } = await postcss([
          postcsso({
            restructure: true,
          }),
        ]).process(css, {
          from: undefined,
        });

        return content;
      };
    },
    compileOptions: {
      permalink: function (contents, inputPath) {
        return inputPath.replace("styles/", "").replace(".scss", ".css");
      },
    },
  });

  eleventyConfig.addTransform("html", function (content) {
    if (this.page.outputPath && this.page.outputPath.endsWith(".html")) {
      return minifyHtml(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true,
      });
    }
    return content;
  });

  eleventyConfig.addCollection("posts", function (collection) {
    return collection.getFilteredByGlob("pages/blog/*.md").sort((a, b) => {
      if (a.date && b.date) {
        return b.date - a.date;
      }
      return 0;
    });
  });

  eleventyConfig.addPlugin(pluginIcons, {
    sources: [{ name: "lucide", path: "node_modules/lucide-static/icons" }],
  });

  eleventyConfig.addFilter("makeDateSexy", (date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  });

  return {
    dir: {
      output: "dist",
    },
  };
}
