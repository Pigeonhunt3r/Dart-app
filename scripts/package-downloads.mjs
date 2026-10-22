import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const script=fileURLToPath(new URL('./package-downloads.py',import.meta.url));
const result=spawnSync('python3',[script,...process.argv.slice(2)],{stdio:'inherit'});
if(result.error)throw result.error;
process.exit(result.status ?? 1);
