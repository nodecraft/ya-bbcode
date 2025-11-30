declare module 'xbbcode-parser' {
	interface TagDefinition {
		openTag?: (params?: string, content?: string) => string;
		closeTag?: (params?: string, content?: string) => string;
		displayContent?: boolean;
		restrictChildrenTo?: string[];
		noParse?: boolean;
	}

	interface ProcessOptions {
		text: string;
		removeMisalignedTags?: boolean;
		addInLineBreaks?: boolean;
	}

	interface ProcessResult {
		html: string;
		error: boolean;
		errorQueue: string[];
	}

	function process(options: ProcessOptions): ProcessResult;
	function addTags(tags: Record<string, TagDefinition>): void;

	export default { process, addTags };
}
