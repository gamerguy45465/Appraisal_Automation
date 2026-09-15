const fs=require('node:fs');const {chromium}=require('playwright');
(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const context=await browser.newContext({offline:true});await context.route('**/*',route=>route.abort());
    const page=await context.newPage();
    async function canonical(file){
      await page.setContent(fs.readFileSync(file,'utf8'),{waitUntil:'domcontentloaded'});
      return page.evaluate(()=>{
        const walker=document.createTreeWalker(document,NodeFilter.SHOW_COMMENT);const comments=[];
        while(walker.nextNode())comments.push(walker.currentNode);
        for(const comment of comments)comment.remove();document.normalize();
        return {html:document.documentElement.outerHTML,doctype:document.doctype?.name,mode:document.compatMode,title:document.title};
      });
    }
    const before=await canonical('tmp/line-comments/originals/public/index.html');const after=await canonical('public/index.html');
    if(JSON.stringify(before)!==JSON.stringify(after)){
      fs.writeFileSync('tmp/line-comments/html-before.json',JSON.stringify(before,null,2));fs.writeFileSync('tmp/line-comments/html-after.json',JSON.stringify(after,null,2));
      throw new Error('HTML DOM or text changed after removing comments');
    }
    console.log('HTML DOM, exact text whitespace, doctype, document mode, and title are unchanged after ignoring added comments.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
