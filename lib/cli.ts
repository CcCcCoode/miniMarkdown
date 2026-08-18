import { parseMarkdown } from './index';

process.stdin.setEncoding('utf8');

let input = '';

process.stdin.on('data', (chunk: string) => {
    input += chunk;
});

process.stdin.on('end', () => {
    console.log(JSON.stringify(parseMarkdown(input), null, 2));
});
