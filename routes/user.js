const express = require("express");
const connection = require("../connection");
const router = express.Router();

const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();
let auth = require('../services/authentication');
let checkRole = require('../services/checkRole');

router.post("/signup", (req, res) => {
  let user = req.body;
  query = "select email, password, role, status from user where email=?";
  connection.query(query, [user.email], (err, results) => {
    if (!err) {
      if (results.length <= 0) {
        query =
          "insert into user(name, contactNumber, email, password, status, role) values(?,?,?,?,'false','user')";
        connection.query(
          query,
          [user.name, user.contactNumber, user.email, user.password],
          (err, results) => {
            if (!err) {
              return res.status(200).json({ message: "Successfully registered" });
            } else {
              return res.status(500).json(err);
            }
          }
        );
      } else {
        return res.status(400).json({ message: "Email already exists" });
      }
    } else {
      return res.status(500).json(err);
    }
  });
});

router.post("/login", (req, res) => {
  const user = req.body;
  query = "select email, password, role, status from user where email=?";
  connection.query(query, [user.email], (err, results) => {
    if (!err) {
      if (results.length <= 0 || results[0].password != user.password) {
        return res.status(401).json({ message: "Incorrect username or password" });
      } else if (results[0].status === 'false') {
        return res.status(401).json({ message: "Wait for admin approval" });
      } else if (results[0].password === user.password) {
        const response = { email: results[0].email, role: results[0].role };
        const accessToken = jwt.sign(response, process.env.ACCESS_TOKEN, {expiresIn: '8h'});
        res.status(200).json({ token: accessToken });
      } else {
        return res.status(400).json({ message: "Something went wrong. Please try again later" });
      }
    } else {
      return res.status(500).json(err);
    }
  });
});

let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD
  }
})

router.post('/forgotPassword', (req, res)=>{
  const user = req.body;
  query = "select email, password from user where email=?";
  connection.query(query, [user.email], (err, results) => {
    if (!err) {
      if (results.length <= 0) {
        return res.status(200).json({message: 'Password was successfully sent to your email'});
      } else {
        let mailOptions = {
          from: process.env.EMAIL,
          to: results[0].email,
          subject: 'Password of Management System',
          html: `<p><b>Your login details for Management System</b><br>
                  <b>Email: </b>${results[0].email}<br>
                  <b>Password: </b>${results[0].password}<br>
                  <a href="http://localhost:4200/">Click here to login</a>
                </p>`
        };
        transporter.sendMail(mailOptions, function(error, info){
          if (error) {
            console.log(error);
          } else {
            console.log(`Email sent ${info.response}`);
          }
        });
        return res.status(200).json({message: 'Password was sent successfully to your email'});
      }
    } else {
      return res.status(500).json(err);
    }
  })
})

router.get('/get', auth.authenticateToken, checkRole.checkRole, (req, res)=> {
  query = "select id, email, password, role, status from user where role='user'";
  connection.query(query, (err, results)=>{
    if (!err) {
      return res.status(200).json(results);
    } else {
      return res.status(500).json(err);
    }
  })
})

router.patch('/update', auth.authenticateToken, checkRole.checkRole, (req, res)=>{
  let user = req.body;
  let query = "update user set status=? where id=?";
  connection.query(query, [user.status, user.id], (err, results)=>{
    if (!err) {
      if (results.affectedRows == 0) {
        return res.status(404).json({message: "User id doesn't exist"});
      }
      return res.status(200).json({message: "User updated successfully"});
    } else {
      return res.status(500).json(err);
    }
  })
})

router.get('/checkToken', auth.authenticateToken, (req, res)=>{
  return res.status(200).json({message: " true"});
})

router.post('/changePassword', auth.authenticateToken, (req, res)=>{
  const user = req.body;
  const email = res.locals.email;
  let query = "select * from user where email=? and password=?";
  connection.query(query, [email, user.oldPassword], (err, results)=>{
    if (!err) {
      if (results.length <= 0) {
        return res.status(400).json({message: "Incorrect old password"});
      } else if(results[0].password == user.oldPassword){
        query = "update user set password=? where email=?";
        connection.query(query, [user.newPassword, email], (err, results)=>{
          if (!err) {
            return res.status(200).json({message: "Password was updated successfully"});
          }else {
            return res.status(500).json(err);
          }
        })
      } else {
        return res.status(400).json({message: "Something went wrong. Please try again later"});
      }
    } else {
      return res.status(500).json(err);
    }
  })

})

module.exports = router;
