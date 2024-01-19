import { Listener } from '~/typings/structs';
import { Api } from 'telegram';
import config from '~/config';

function getContent(msg: Api.Message, listener?: Listener, channel?: any) {
	let content: string | string[] = msg.rawText;

	const entities = (msg.entities?.filter(e => e.className === 'MessageEntityTextUrl') ?? []).sort((a, b) => b.offset - a.offset);
	const offsets = [];

	const areLinksAllowed = (config.messages?.embeds ?? true) || (channel?.embeds ?? listener.embeds);

	for (const entity of entities as (Api.TypeMessageEntity & { originalOffset: number; url: string; })[]) {
		const premades = offsets.filter(o => o.orig < entity.offset);
		entity.originalOffset = entity.offset;

		for (const premade of premades) entity.offset += premade.length;

		const name = content.substr(entity.offset, entity.length);
		if (name === entity.url || name.startsWith('http')) continue;

		const start = content.slice(0, entity.offset);
		const end = content.slice(entity.offset + entity.length);

		const areLinksAllowedForCurrentEntity = (config.messages?.allowedEmbeds ?? []).some(allowed => ~entity.url.indexOf(allowed));
		const replacement = name === entity.url ? entity.url : `[${name}](${(areLinksAllowed || areLinksAllowedForCurrentEntity) ? entity.url : ('<' + entity.url + '>')})`;

		offsets.push({
			orig: entity.originalOffset ?? entity.offset,
			length: replacement.length - entity.length
		});

		content = start + replacement + end;
	}

	if (config.messages?.replacements) {
		for (const [subject, replacement] of Object.entries(config.messages.replacements)) {
			content = content.replaceAll(subject, replacement);
		}
	}

	if (config.messages?.capture) {
		let _content = content;
		let temp = {};

		for (const capture in config.messages.capture) {
			const regex = new RegExp(config.messages.capture[capture], 'gmi');
			temp[capture] = _content.match(regex);
		}

		content = [];
		const results = (Object.values(temp)[0] as string)?.length ?? 0;

		for (let i = 0; i < results; i++) {
			let out = config.messages.capture_format;
			for (const [key, value] of Object.entries(temp)) {
				if (!value?.[i]) continue;
				out = out.replaceAll(`{{${key}}}`, (value[i] as string).replaceAll('\n', ''));
			};

			content.push(out);
		}
	}

	if (!areLinksAllowed) {
		if (Array.isArray(content)) {
			for (const chunk of content) {
				const idx = content.indexOf(chunk);

				const links = chunk.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gmi);
				if (!links?.length) return content;

				for (const link of links) {
					const areLinksAllowedForCurrentEntity = (config.messages?.allowedEmbeds ?? []).some(allowed => ~link.indexOf(allowed));

					if (!areLinksAllowedForCurrentEntity) {
						content[idx] = chunk.replaceAll(link, `<${link}>`);
					}
				}

			}
		} else {
			const links = content.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gmi);
			if (!links?.length) return content;

			for (const link of links) {
				const areLinksAllowedForCurrentEntity = (config.messages?.allowedEmbeds ?? []).some(allowed => ~link.indexOf(allowed));

				if (!areLinksAllowedForCurrentEntity) {
					content = content.replaceAll(link, `<${link}>`);
				}
			}
		}
	}

	return content;
}

export default getContent;