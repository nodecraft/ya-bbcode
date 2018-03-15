'use strict';
let yabbc = require('./ya-bbcode.js');

let bbc = `[img]http://i.imgur.com/ZBm6hbZ.png[/img][b]more[/b]

[quote=[b]text[/b][/quote]

[ LOL | More STUFF | [url]LINK[/url] ]

[list]
[*] ITEM
[*] ITEM
[*] ITEM
[*] ITEM
[/LIST]

[b] Tek Glass adds a Glass Tek Tile-Set to your game. The Tek Glass structures have options in the radial menu to allow different transparencies, such as one way glass, or two way glass.

[h1] [b]THIS MOD IS CLEAN AND STACKABLE ! :) [/b][/h1]

[b]==============================================[/b]

[code][h1] Mod ID - 1093831470 [/h1][/code]

[code][h1] Mod Version - v1.51 [/h1][/code]

[code][h1] Links to the discussion posts :
[url=http://steamcommunity.com/workshop/filedetails/discussion/1093831470/1470840994966888803/]- Spawn Codes -[/url]
[url=http://steamcommunity.com/workshop/filedetails/discussion/1093831470/1470840994966939077/]- ConfigOverrideItemCraftingCosts -[/url]
[url=http://steamcommunity.com/workshop/filedetails/discussion/1093831470/1470840994966942400/]- OverrideEngramEntries -[/url][/h1][/code]

[b]==============================================[/b]

[img]http://i.imgur.com/vYJKVgE.png[/img]

[b]To [url=http://steamcommunity.com/profiles/76561197989614076/]+ｃｒｕｎｃｈａ[/url] for the images!

To The ARK Modding Discord Community <3[/b]

[b]==============================================[/b]

This mod/code/work is protected by the [URL=http://creativecommons.org/licenses/by-nc-nd/4.0/legalcode]Attribution-NonCommercial-NoDerivatives 4.0 International Creative Commons License.
[IMG]https://i.creativecommons.org/l/by-nc-nd/4.0/88x31.png[/IMG][/URL]`;

let parser = new yabbc();

console.dir(parser.parse(bbc), {depth: 909999});