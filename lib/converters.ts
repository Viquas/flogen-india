export function jsonToMarkdown(jsonString: string): string {
    try {
        const data = JSON.parse(jsonString)
        let md = `# ${data.businessName || 'Business Name'}\n\n`

        if (data.industry) {
            md += `**Industry:** ${data.industry}\n\n`
        }

        if (data.description) {
            md += `## Description\n${data.description}\n\n`
        }

        if (data.services && Array.isArray(data.services)) {
            md += `## Services\n`
            data.services.forEach((service: string) => {
                md += `- ${service}\n`
            })
            md += `\n`
        }

        if (data.contactInfo) {
            md += `## Contact Info\n`
            if (data.contactInfo.email) md += `- **Email:** ${data.contactInfo.email}\n`
            if (data.contactInfo.phone) md += `- **Phone:** ${data.contactInfo.phone}\n`
            if (data.contactInfo.website) md += `- **Website:** ${data.contactInfo.website}\n`
        }

        return md.trim()
    } catch (e) {
        return jsonString // Fallback
    }
}

export function markdownToJson(md: string, currentJson: string): string {
    try {
        const lines = md.split('\n')
        const currentData = JSON.parse(currentJson)
        const newData = { ...currentData }

        // Very basic extraction logic
        const nameMatch = md.match(/^#\s+(.+)$/m)
        if (nameMatch) newData.businessName = nameMatch[1].trim()

        const industryMatch = md.match(/^\*\*Industry:\*\*\s+(.+)$/m)
        if (industryMatch) newData.industry = industryMatch[1].trim()

        // Description extraction (between ## Description and next #)
        const descMatch = md.match(/## Description\n([\s\S]+?)(?=\n#|$)/)
        if (descMatch) newData.description = descMatch[1].trim()

        // Services extraction
        const servicesMatch = md.match(/## Services\n((?:- .+\n?)+)/)
        if (servicesMatch) {
            newData.services = servicesMatch[1]
                .split('\n')
                .filter(l => l.startsWith('- '))
                .map(l => l.replace('- ', '').trim())
        }

        return JSON.stringify(newData, null, 2)
    } catch (e) {
        return currentJson // Fallback
    }
}
