import { validISO } from '../dist/timeline.js';
// A dependency-free validator for the exact JSON Schema vocabulary used in our schemas.
// Unknown validation keywords fail loudly rather than being silently ignored.
export function validateSchema(value,schema,root=schema,path='$'){
  const allowed=new Set(['$schema','$defs','$ref','title','description','type','required','properties','items','enum','const','pattern','format','minLength','minItems','uniqueItems','exclusiveMinimum','if','then','else']);
  for(const key of Object.keys(schema))if(!allowed.has(key))throw Error(`Unsupported schema keyword ${key}`);
  if(schema.$ref){let target=root;for(const segment of schema.$ref.replace(/^#\//,'').split('/'))target=target[segment];if(!target)throw Error(`Unresolved schema reference ${schema.$ref}`);return validateSchema(value,target,root,path);}
  const fail=message=>{throw Error(`${path}: ${message}`);};
  const type=value===null?'null':Array.isArray(value)?'array':typeof value==='number'&&Number.isInteger(value)?'integer':typeof value;
  if(schema.type&&!([schema.type].flat().includes(type)||(type==='integer'&&[schema.type].flat().includes('number'))))fail(`expected ${schema.type}, got ${type}`);
  if(schema.const!==undefined&&JSON.stringify(value)!==JSON.stringify(schema.const))fail('const mismatch');
  if(schema.enum&&!schema.enum.some(v=>JSON.stringify(v)===JSON.stringify(value)))fail('enum mismatch');
  if(typeof value==='string'){
    if(schema.minLength!==undefined&&value.length<schema.minLength)fail('too short');
    if(schema.pattern&&!new RegExp(schema.pattern).test(value))fail('pattern mismatch');
    if(schema.format==='date'&&!validISO(value))fail('invalid date');
    if(schema.format==='uri'){try{new URL(value);}catch{fail('invalid URI');}}
  }
  if(typeof value==='number'&&schema.exclusiveMinimum!==undefined&&value<=schema.exclusiveMinimum)fail('below exclusive minimum');
  if(Array.isArray(value)){
    if(schema.minItems!==undefined&&value.length<schema.minItems)fail('too few items');
    if(schema.uniqueItems&&new Set(value.map(v=>JSON.stringify(v))).size!==value.length)fail('duplicate item');
    if(schema.items)value.forEach((v,i)=>validateSchema(v,schema.items,root,`${path}[${i}]`));
  }
  if(value!==null&&typeof value==='object'&&!Array.isArray(value)){
    for(const key of schema.required||[])if(!Object.hasOwn(value,key))fail(`missing ${key}`);
    for(const [key,rule]of Object.entries(schema.properties||{}))if(Object.hasOwn(value,key))validateSchema(value[key],rule,root,`${path}.${key}`);
  }
  if(schema.if){let matches=true;try{validateSchema(value,schema.if,root,path);}catch{matches=false;}if(matches&&schema.then)validateSchema(value,schema.then,root,path);if(!matches&&schema.else)validateSchema(value,schema.else,root,path);}
  return true;
}
