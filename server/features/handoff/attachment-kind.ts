import { openSync, readSync, closeSync, constants } from 'node:fs';
/** Identification does not claim visual interpretation. Paths have already passed owned hash read-back. */
export function attachmentKind(path:string,mime:string,name:string):'image'|'pdf'|'docx'|'text'|'unsupported' {
 const fd=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW),head=Buffer.alloc(16);let count:number;
 try{count=readSync(fd,head,0,head.length,0);}finally{closeSync(fd);}
 const bytes=head.subarray(0,count),ascii=bytes.toString('ascii');
 if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||bytes[0]===255&&bytes[1]===216&&bytes[2]===255||ascii.startsWith('GIF8')||ascii.startsWith('RIFF')&&ascii.slice(8,12)==='WEBP'||mime.startsWith('image/')||/\.(png|jpe?g|gif|webp|svg)$/i.test(name))return 'image';
 if(ascii.startsWith('%PDF-')||mime==='application/pdf'||/\.pdf$/i.test(name))return 'pdf';
 if(/wordprocessingml/.test(mime)||/\.docx$/i.test(name))return 'docx';
 if(mime.startsWith('text/')||/\.(txt|md|csv|json)$/i.test(name))return 'text';
 return 'unsupported';
}
