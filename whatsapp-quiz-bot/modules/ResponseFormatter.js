class ResponseFormatter {
    format(response, questionType) {
        if (response === 'Nx') {
            return 'Nx';
        }

        let formatted = response.trim();

        if (formatted.endsWith('.')) {
            formatted = formatted.slice(0, -1);
        }

        if (formatted.length > 4000) {
            formatted = formatted.substring(0, 4000);
        }

        return formatted;
    }
}

module.exports = ResponseFormatter;
