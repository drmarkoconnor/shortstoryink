export default function (eleventyConfig) {
	eleventyConfig.addPassthroughCopy({ 'src/assets': 'assets' })

	return {
		dir: {
			input: 'src',
			includes: '_includes',
			data: '_data',
			output: '_site',
		},
		markdownTemplateEngine: 'njk',
		htmlTemplateEngine: 'njk',
		templateFormats: ['njk', 'md', 'html'],
	}
}

