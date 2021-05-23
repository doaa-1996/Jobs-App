/* eslint-disable indent */
'use strict';
const express = require('express');
const server = express();
const pg = require('pg');
const cors = require('cors');
const methodOverride = require('method-override');
const superagent = require('superagent');
require('dotenv').config();
server.use(cors());
server.use(express.urlencoded({ extended: true }));
server.use(methodOverride('_method'));
server.use(express.static('./public'));
server.set('view engine', 'ejs');
const PORT = process.env.PORT || 3000;
const client = new pg.Client(process.env.DATABASE_URL);
// const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

server.get('/', handleHomePage);
server.get('/searchpage', handleSearchPage);
server.post('/search', handleSearch);
server.post('/addToList',handleAddToList);
server.get('/list',handlelist);
server.post('/showdetails/:id',handleShowDetails);
server.delete('/delete/:id',handledelete);
server.put('/update/:id',handleupdate);


function handleHomePage(req, res) {
    let url = 'https://jobs.github.com/positions.json?location=usa';
    superagent(url).then(result => {
        let arr = result.body.map(item => {
            return new Jobs(item);
        });
        res.render('home', { result: arr });

    });
}

function handleSearchPage(req, res) {
    res.render('search');
}

function handleSearch(req, res) {
    let description = req.body.description;
    console.log(description);
    let url = `https://jobs.github.com/positions.json?description=${description}&location=usa `;
    superagent(url).then(result => {
        console.log(result.body);
        let resultarr = result.body.map(item => {
            return new Jobs(item);
        });
        res.render('result', {searchresult: resultarr });
    });
}

function handleAddToList(req,res){
let {title,company,location,url}=req.body;
let sql=`INSERT INTO jobs (title,company,location,url) VALUES($1,$2,$3,$4);`;
let safevalues=[title,company,location,url];
client.query(sql,safevalues).then(()=>{
res.redirect('/list');
});
}

function handlelist(req,res){
    let sql=`SELECT * FROM jobs ;`;
    client.query(sql).then(result=>{
        res.render('list',{list:result.rows});
    });
}

function handleShowDetails(req,res){
    let id=req.params.id;
    let sql=`SELECT * FROM jobs WHERE id=${id};`;
    client.query(sql).then(result=>{
        res.render('details',{details:result.rows});
    });
}

function handledelete(req,res){

    let id=req.params.id;
    let sql=`DELETE  FROM jobs WHERE id=${id};`;
  client.query(sql).then(()=>{
      res.redirect('/list');
    });
}

function handleupdate(req,res){
    let {title,company,location,url}=req.body;
    let id=req.params.id;
    let sql=`UPDATE jobs SET title=$1, company=$2, location=$3,url=$4 WHERE id=${id};`;
    let safevalues=[title,company,location,url];
    client.query(sql,safevalues).then(()=>{
        res.redirect(`/showdetails/:${id}`);
    });
}

function Jobs(data) {
    this.title = data.title;
    this.company = data.company;
    this.location = data.location;
    this.url = data.url;
}




client.connect().then(() => {
    server.listen(PORT, () => {
        console.log(`Listening on port ${PORT}`);
    });
});
