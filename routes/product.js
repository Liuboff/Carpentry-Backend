const express = require('express');
const connection = require('../connection');
const router = express.Router();
let auth = require('../services/authentication');
let checkrole = require('../services/checkRole');

router.post('/add', auth.authenticateToken, checkrole.checkRole, (req, res)=>{
  let product = req.body;
  let query = "insert into product (name, categoryId, description, price, status) values(?,?,?,?,'true')";
  connection.query(query, [product.name, product.categoryId, product.description, product.price], (err, results)=>{
    if (!err) {
      return res.status(200).json({message: "Product was added successfully"});
    } else {
      return res.status(500).json(err);
    }
  })
})

router.get('/get', auth.authenticateToken, (req, res, next)=>{
  let query =
    "select p.id, p.description, p.price, p.status, c.id as categoryId, c.name as categoryName from product as p INNER JOIN category as c where p.categoryId = c.id";
  connection.query(query, (err, results)=>{
    if (!err) {
      return res.status(200).json(results);
    } else {
      return res.status(500).json(err);
    }
  })
})

router.get('/getByCategory/:id', auth.authenticateToken, (req, res, next)=>{
  const id = req.params.id;
  let query =
    "select id, name from product where categoryId=? and status='true'";
  connection.query(query, [id], (err, results)=>{
    if (!err) {
      return res.status(200).json(results);
    } else {
      return res.status(500).json(err);
    }
  })
})

router.get('/getById/:id', auth.authenticateToken, (req, res, next)=>{
  const id = req.params.id;
  let query =
    "select id, name, description, price from product where id=?";
  connection.query(query, [id], (err, results)=>{
    if (!err) {
      return res.status(200).json(results);
    } else {
      return res.status(500).json(err);
    }
  })
})

router.patch('/update', auth.authenticateToken, checkrole.checkRole, (req, res, next)=>{
  let product = req.body;
  let query =
    "update product set name=?, categoryId=?, description=?, price=? where id=?";
  connection.query(query, [product.name, product.categoryId, product.description, product.price, product.id], (err, results)=>{
    if (!err) {
      if (results.affectedRows == 0) {
        return res.status(404).json({message: "Product id wasn't found"});
      }
      return res.status(200).json({message: "Product was updated successfully"});
    } else {
      return res.status(500).json(err);
    }
  })
})

router.delete('/delete/:id', auth.authenticateToken, (req, res, next)=>{
  const id = req.params.id;
  let query =
    "delete from product where id=?";
  connection.query(query, [id], (err, results)=>{
    if (!err) {
      if (results.affectedRows == 0) {
        return res.status(404).json({message: "Product id wasn't found"});
      }
      return res.status(200).json({message: "Product was deleted successfully"});
    } else {
      return res.status(500).json(err);
    }
  })
})

router.patch('/updateStatus', auth.authenticateToken, checkrole.checkRole, (req, res, next)=>{
  let user = req.body;
  let query =
    "update product set status=? where id=?";
  connection.query(query, [user.status, user.id], (err, results)=>{
    if (!err) {
      if (results.affectedRows == 0) {
        return res.status(404).json({message: "Product id wasn't found"});
      }
      return res.status(200).json({message: "Product status was updated successfully"});
    } else {
      return res.status(500).json(err);
    }
  })
})

module.exports = router;