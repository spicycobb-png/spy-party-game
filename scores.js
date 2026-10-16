const fs=require('node:fs'),path=require('node:path');
const names=['ปุ๊ก','พี่โอ๊ด','ยอด','โย','ปิงปอง','เอิร์น'];
const file=process.env.SCORES_FILE||path.join(__dirname,'scores-data.json');
let data={epoch:Date.now(),rows:Object.fromEntries(names.map(n=>[n,{spy:0,under:0,who:0,four:0}])),awarded:[]};
try{const saved=JSON.parse(fs.readFileSync(file,'utf8'));if(saved.rows&&saved.awarded)data=saved}catch{}
for(const name of names)data.rows[name]={spy:0,under:0,who:0,four:0,...data.rows[name]};
function save(){const temp=file+'.tmp';fs.writeFileSync(temp,JSON.stringify(data));fs.renameSync(temp,file)}
exports.view=()=>({epoch:data.epoch,players:names.map(name=>({name,...data.rows[name],total:Object.values(data.rows[name]).reduce((a,b)=>a+b,0)})).sort((a,b)=>b.total-a.total)});
exports.award=(game,id,winners,points=1)=>{if(data.awarded.includes(id))return;for(const name of new Set(winners))if(data.rows[name])data.rows[name][game]+=points;data.awarded.push(id);save()};
exports.reset=()=>{data={epoch:Math.max(Date.now(),data.epoch+1),rows:Object.fromEntries(names.map(n=>[n,{spy:0,under:0,who:0,four:0}])),awarded:data.awarded};save();return exports.view()};
exports.api=async(req,res)=>{let body='';for await(const c of req){body+=c;if(body.length>2000)throw Error('ข้อมูลยาวเกินไป')}const b=JSON.parse(body||'{}');if(req.method==='POST'){if(b.action!=='reset'||b.confirm!==true)throw Error('ยืนยันการรีเซ็ตก่อน');if(b.epoch!==data.epoch)throw Error('คะแนนเปลี่ยนแล้ว กรุณารีเฟรช');exports.reset()}else if(req.method!=='GET')throw Error('คำขอไม่ถูกต้อง');res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(exports.view()))};
