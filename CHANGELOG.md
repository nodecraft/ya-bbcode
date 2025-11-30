# Changelog

## 5.0.0

### Major Changes

- **Space-separated Tag Attributes**: Support for multiple attributes in BBCode tags
	- Simple attribute syntax: `[tag=value]` (existing format, fully supported)
	- Space-separated attributes: `[code lang=javascript highlight]`
	- Boolean flags: `[code skip-lint]`
	- Key-value pairs: `[code lang=javascript]`
	- Mixed attributes: `[code lang=javascript skip-lint highlight]`

### Security Improvements

- **URL Scheme Allowlist**: New `allowedSchemes` config option to customize which URL schemes are allowed
	- Default: `['http', 'https', 'mailto', 'ftp', 'ftps']`
	- Dangerous schemes like `javascript:`, `data:`, and `vbscript:` are blocked by default
	- Set to `[]` to block all absolute URLs while allowing relative URLs
	- Example: `new yabbcode({ allowedSchemes: ['https', 'mailto'] })` to allow only HTTPS and mailto links
- **XSS Protection**: HTML attribute values are properly escaped to prevent attribute injection attacks
- **Prototype Pollution Protection**: Dangerous attribute names (`__proto__`, `constructor`, `prototype`) are filtered out

### Performance Improvements

- **Stack-based Tag Matching**: Replaced O(n²) algorithm with O(n) stack-based approach
  - Dramatically faster parsing for deeply nested structures
  - More memory efficient for large documents

- **Adaptive Content Processing**: Smart threshold-based optimization
  - Documents with >50 tags automatically use optimized single-pass replacement
  - Batch processing for complex documents

- **Optimized HTML Sanitization**: Batch HTML entity replacement using regex for better performance

### Breaking Changes

- For most use-cases, there should be no noticeable differences in functionality, just with improved performance and security. However:
	- Due to the TypeScript migration and build system changes, there are some minor changes to types to be more accurate and strict
	- Tag attribute and content callbacks now receive an additional `attrs` parameter: `(attr: string, attrs: TagAttributes) => string`
	- Dangerous URL schemes are now blocked by default in `[url]` tags (previously would pass through)

### Bug Fixes

- Fixed proper type discrimination for tag definitions
- Improved handling of optional properties

## 4.0.0

- By default, any HTML input is now escaped to prevent possible security issues from untrusted input. If you need to disable this for any reason (for the behaviour of previous versions), construct `ya-bbcode` like this:
```javascript
const parser = new yabbcode({sanitizeHtml: false});
```
