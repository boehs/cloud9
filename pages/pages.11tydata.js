export default {
  layout: "base.njk",
  permalink: '{{ page.filePathStem | dropContentFolder: "pages" }}.html',
};
