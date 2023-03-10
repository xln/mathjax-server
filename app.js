const http = require("http");
const qs = require("querystring");
const mjAPI = require("mathjax-node");

const argv = qs.parse(process.argv.slice(2).join('&'));
const port = argv.PORT || 8008;
// mjAPI.config({MathJax: {}});
// mjAPI.start();
http
  .createServer((request, response) => {
    response.setHeader("Access-Control-Allow-Origin", "*");
    if (request.method === "POST" && request.url === "/mathjax") {
      response.setHeader("Content-Type", "application/json");
      let body = [];
      request
        .on("data", (chunk) => {
          body.push(chunk);
        })
        .on("end", () => {
          body = Buffer.concat(body).toString();
          body = qs.parse(body);
          const {math,format} = body;
          mjAPI.typeset(
            {
              math: math,
              format: format, // or "TeX","inline-TeX", "MathML"
              svg: true,
              mml: true, // or svg:true, or html:true
            },
            function (data) {
              if (!data.errors) {
                response.end(JSON.stringify(data));
              }else{
                response.statusCode = 500;
                response.end(data.errors.toString());
              }
            }
          );
        })
        .on("error",(err)=>{
            response.statusCode = 400;
            response.end();
        })
    } else if (request.method === "GET" && request.url === "/") {
      response.statusCode = 200;
      response.end(
        `<html>
            <meta charset="UTF-8">
            <body>
                <h1>/mathjax</h1>
                <label htmlFor="math">math：</label>
                <textarea name="math" cols="30" rows="5" id="math" placeholder="请输入公式源码" >E_{\\rm k}=\\frac{1}{2} m v^{2}=\\frac{1}{2} \\rho v t S v^{2}=\\frac{1}{2} \\rho \\pi r^{2} v^{3} t</textarea>
                <br />
                <br />
                <label htmlFor="format">format:
                    <input name="format" type="radio" value="TeX" checked >TeX</input>
                </label>
                <label>
                    <input name="format" type="radio" value="MathML" >MathML</input>
                </label>
                <button type="submit" id="submit">提交</button>
                <br />
                <br />
                <div><img src="" alt="svg" id="svg" /></div>
                <script src="//code.jquery.com/jquery-3.6.4.min.js"></script>
                <script>
                    function svgToBase64(svg){
                      return 'data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(svg)));
                    }
                    window.onload = function(){
                        $('#submit').click(function(){
                            let math = $('[name=math]').val();
                            let format = $('[name=format]:checked').val();
                            if(format==='MathML'){
                                math = math.replace(/[\\n]/g,'');
                            }
                            $.ajax({
                                url:'/mathjax',
                                type:'POST',
                                timeout:5000,
                                data: {math:math,format:format},
                                success:function(data){
                                    console.log('操作成功',data.mml);
                                    $('#svg').attr('src',svgToBase64(data.svg));
                                },
                                error:function(err){
                                    console.log('出错了',err);
                                    alert(err.responseText);
                                }
                            });
                        })
                    }
                </script>
            </body>
        </html>`
      );
    } else if (request.url === "/ruok") {
      response.statusCode = 200;
      response.end("ok");
    } else {
      response.statusCode = 404;
      response.end();
    }
  })
  .listen(port, () => {
    console.log(`Starting up http-server http://127.0.0.1:${port}`);
  });
