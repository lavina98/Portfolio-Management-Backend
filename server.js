var express=require('express');
var mysql = require('mysql');
var app = express();
var bodyParser = require('body-parser');
var request=require('request');
app.listen(8080);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "pmtemp",
    multipleStatements: true
  });
con.connect(function(err){
    if(!err) {
        console.log("Database is connected ... nn");
    } else {
        console.log("Error connecting database ... nn");
    }
});



//Alpha vantage key: WVIU7ES3D1X27ERU




app.get('/', function(req, res) {
    // render to views/index.ejs template file
    res.send('listening');
});

app.post('/api/users',function(req,res){

    var uname="'"+req.body.uname+"'";
    var password="'"+req.body.password+"'";
    var email_id="'"+req.body.email_id+"'";
    var query='Insert into user (uname,password,networth,email_id) values ('+uname+',SHA1('+password+') ,';
    query+='0,'+email_id+')';
    console.log(query);
    con.query(query,function(err,result){
        if(err)
        {
            console.log('error registering');
            res.send('error');
        }
        else
        {
            console.log('successful registration');
            res.json('success');
        }
    })
});

app.post('/api/user',function(req,res){

    var uname="'"+req.body.uname+"'";
    var password="'"+req.body.password+"'";
    var query="Select * from user where uname="+uname+"and password= SHA1("+password+")";
    console.log(query);
    con.query(query,function(err,result){
        // console.log(result);
        if(err)
        {
            console.log(err);
            res.send(err);
        }
        else if(result.length)
        {
            // console.log(result);
            res.json({uname:req.body.uname,id:result[0].id});
        }
        else
        {
            var query1="Select * from user where uname="+uname;
            con.query(query1,function(err,result){
                console.log(result);
                if(err)
                    res.send(err);
                else if(result.length)
                    res.json('Incorrect password');
                else
                    res.json('Incorrect username');
            })
        }
    })
    
});

app.get('/api/users/:id/portfolios',function(req,res){
    console.log(req.params.id);
    var query='Select * from portfolio where user_id='+req.params.id;
    console.log(query);
    con.query(query,function(err,results){
        if(err)
            console.log(err);
        else
            res.json(results);
    })

})



app.post('/api/users/:id/portfolios',function(req,res){
    console.log(req.params.id);
    var p_name="'"+req.body.p_name+"'";
    var p_worth=req.body.p_worth;
    var user_id=req.params.id;
    var query='Insert into portfolio (p_name,p_worth,user_id) values ('+p_name+","+p_worth+","+user_id+')';
    console.log(query);
    con.query(query,function(err,results){
        if(err)
        {
            console.log(err);
            res.send(err);
        }
        else
            res.json('success');
    })

})

app.delete('/api/users/:uid/portfolios/:pid',function(req,res){
    var pid=req.params.pid;
    var query='Delete from portfolio where p_id='+pid;
    con.query(query,function(err,results){
        if(err)
            res.send(err);
        else
            res.json('success');
    });
})


app.get('/api/users/portfolios/:pid/userstocks',function(req,res){
    var pid=req.params.pid;
    var query='Select * from userstock where p_id='+pid;
    con.query(query,function(err,results){
        if(err)
            res.send(err);
        else
            res.json(results);
    })
})

// WVIU7ES3D1X27ERU
app.get('/api/stocks',function(req,res){
    var query="Select * from stock";
    con.query(query,function(err,results){
        if(err)
            res.send(err);
        else
        {
            res.send(results);
        }
    });
})

/***most imp gets realtime value of all stocks */
app.get('/api/stockval',function(req,res){
    var query="Select * from stock";
    con.query(query,function(err,results){
        if(err)
            res.send(err);
        else
        {
           
            var url='https://www.alphavantage.co/query?function=BATCH_STOCK_QUOTES&symbols='
            for( var i=0;i<results.length-1 ;i++)
            {
                  url+=results[i]['symbol']+",";
            }
            url+=results[results.length-1]['symbol']+'&apikey=WVIU7ES3D1X27ERU';
            console.log(url);
            request.get(url, (error, response, body) => {
                if(error) {
                    res.send(err);
                }
                else
                {
                    // console.log(results);
                    var sql1='';
                    var temp=(JSON.parse(body)['Stock Quotes']);
                    console.log(temp);
                    for(i=0;i<results.length;i++)
                    {
                        console.log(results[i]['currprice'])
                        console.log(temp[i]['2. price']);
                        results[i]['currprice']=temp[i]['2. price'];
                        sql1+='update stock set currprice='+temp[i]['2. price']+" where symbol='"+results[i]['symbol']+"' ;";
                    }
                    console.log(sql1);
                    con.query(sql1,function(err,result){
                        if(err)
                            res.send(err)
                        else
                        res.json('success getting and storing real time values');

                    })
                    
                }
            });
        }
    });
})



app.get('/api/stocks/:sym',function(req,res){
    // consume alpha vantage api here
    var url='https://www.alphavantage.co/query?function=BATCH_STOCK_QUOTES&symbols='+sym;
    url+='&apikey=WVIU7ES3D1X27ERU'


})

app.get('/api/users/:id/transactions',function(req,res){
    var uid=req.params.id;
    var query='Select t.t_id,t.type,p.p_id,p.p_name,t.s_name,t.price,t.quantity from  transaction t natural join portfolio p ';
    query+='where p.user_id='+uid;
    con.query(query,function(err,results){
        if(err)
            res.send(err);
        else
            res.json(results);
    });

})

app.post('/api/users/:id/transactions',function(req,res){
    var type="'"+req.body.type+"'";
    var p_id=req.body.p_id;
    var name="'"+req.body.s_name+"'";
    var price=req.body.price;
    var quantity=req.body.quantity;

    var query='Insert into transaction (type,p_id,s_name,price,quantity) values ('+type+","+p_id+","+name;
    query+=","+price+","+quantity+")";
    con.query(query,function(err,results){
        if(err)
            res.send(err);
        else
            res.json('success');
    });

})


app.post('/api/userstocks/:type',function (req,res){
        var s_name="'"+req.body.s_name+"'";
        var quantity=req.body.quantity;
        var price=req.body.price;
        var p_id=req.body.p_id;
        var type=req.params.type;
        var query='Select * from userstock where p_id='+p_id+' and s_name='+s_name;
        con.query(query,function(err,results){
            if(err)
                res.send(err);
            else if(results.length)
            {
                console.log(results);
                var newprice,newquantity;
                if(type=='buy')
                {
                    newprice=((quantity*price)+(results[0].quantity*results[0].price))/(quantity+results[0].quantity);
                    newquantity=quantity+results[0].quantity;
                    console.log(newprice+"  "+newquantity);
                    var query1="Update userstock set quantity="+newquantity+ ", price="+newprice +" where s_id="+results[0].s_id;
                    console.log(query1);
                    con.query(query1,function(err,results){
                        if(err)
                            res.send(err);
                        else
                            res.json('success updating');
                    });
    
                }
                else 
                {
                    newprice=((results[0].quantity*results[0].price)-(quantity*price))/(results[0].quantity-quantity);
                    newquantity=results[0].quantity-quantity;
                    if(newquantity==0)
                    {
                        var query2="Delete from userstock where s_id="+results[0].s_id;
                        con.query(query2,function(err,results){
                            if(err)
                                res.send(err);
                            else
                                res.json('success deleting as all sold');
                        });
        
                    }
                    else
                    {
                        var query2="Update userstock set quantity="+newquantity+ " , price="+newprice +" where s_id="+results[0].s_id;
                        con.query(query2,function(err,results){
                            if(err)
                                res.send(err);
                            else
                                res.json('success updating by selling');
                        });
        
                    }
                }
               
            }
            else
            {
                var query2="Insert into userstock (s_name,quantity,price,p_id) values ("+s_name+","+quantity+","+price+","+p_id+")";
                con.query(query2,function(err,results){
                    if(err)
                        res.send(err);
                    else
                        res.json('success updating new val so inserted');
                });

            }
        });
    
})

app.delete('/api/users/:id/transactions/:tid',function(req,res){

    var query="Delete from transaction where t_id="+req.params.tid;
    con.query(query,function(err,results){
        if(err)
            res.send(err);
        else
            res.json('Successfully deleted transaction');
    })

})

app.get('/api/portfolios/:pid',function(req,res){
    var pid=req.params.pid;
    var query='Select u.quantity,s.currprice from userstock u, stock s where u.p_id='+pid;
    query+=' and u.s_name=s.name';
    console.log(query);
    con.query(query,function(err,results){
        if(err)
            console.log(err);
        else
        {
            // console.log(results);
            var value=0;
            for(var x in results)
            {
                value+=results[x].quantity*results[x].currprice;
            }
            console.log(value);
            var q2='Update portfolio set p_worth='+value+' where p_id='+pid;
            con.query(q2,function(err,results){
                if(err)
                    res.send(err);
                else
                    res.json({val:value});
            })
        }
    })
})


app.get('/api/:uid/pNames',function(req,res){
    var query='Select p_name from portfolio where user_id='+req.params.uid;
    con.query(query,function(err,results){
        if(err)
            res.send(err);
        else
            res.json(results);
    })
})


app.get('/api/:uid/pWorths',function(req,res){
    var query='Select p_worth from portfolio where user_id='+req.params.uid;
    con.query(query,function(err,results){
        if(err)
            res.send(err);
        else
            res.json(results);
    })
})