# Changelog

## 4.0.0

- By default, any HTML input is now escaped to prevent possible security issues from untrusted input. If you need to disable this for any reason (for the behaviour of previous versions), construct `ya-bbcode` like this:
```javascript
const parser = new yabbcode({sanitizeHtml: false});
```