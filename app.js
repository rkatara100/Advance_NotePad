const express = require('express');
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');
const userModel = require('./models/user');
const postModel = require('./models/post');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const multerconfig = require('./config/multerconfig'); // Ensure this file is correctly configured

// Setting up view engine and middlewares
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());


// Middleware to check if user is logged in
function loggedIn(req, res, next) {

      const token = req.cookies.token;

      console.log("token: ", token);

      if (token === "") {
            return res.redirect('/login');
      }

      //check karo token ko
      jwt.verify(token, "ssshh", (err, data) => {

            if (err) {
                  return res.redirect('/login');
            }
            else {

                  let data = jwt.verify(token, "ssshh");
                  req.user = data;
                  next();
            }



      });
}



// Routes
app.get('/', (req, res) => {
      res.render('index');
});


app.use('/profile/upload', (req, res) => {
      res.render('uploadprofile');

});


app.post('/upload', loggedIn, multerconfig.single('image'), async (req, res) => {


      const user = await userModel.findOne({ email: req.user.email });
      console.log(req.file.filename);

      user.profilepic = req.file.filename;

      await user.save();

      res.redirect('/profile');
});



app.use('/profile', loggedIn, async (req, res) => {
      // console.log("Requesting profile for user:", req.user); // Debugging line
      let user = await userModel.findOne({ email: req.user.email }).populate('posts');

      // console.log(user.posts);
      res.render('profile', { user });  // yahan se user bhej rhe hai
});


app.use('/like/:id', loggedIn, async (req, res) => {
      let post = await postModel.findOne({ _id: req.params.id }).populate('user');


      console.log("rohit:", req.user.userid);
      if (post.likes.indexOf(req.user.userid) === -1) {
            post.likes.push(req.user.userid);
      }
      else {
            post.likes.splice(post.likes.indexOf(req.user.userid), 1);
      }

      await post.save();
      res.redirect('/profile');
});

app.use('/edit/:id', loggedIn, async (req, res) => {

      let post = await postModel.findOne({ _id: req.params.id }).populate('user');

      res.render("edit", { post });
});

app.use('/update/:id', loggedIn, async (req, res) => {

      let post = await postModel.findOneAndUpdate({ _id: req.params.id }, { content: req.body.content }, { new: true });

      res.redirect('/profile');
});

app.use('/delete/:id', loggedIn, async (req, res) => {

      let post = await postModel.findOneAndDelete({ _id: req.params.id });

      res.redirect('/profile');
});








//user creation and define userModel
app.post('/register', async (req, res) => {

      const { username, name, email, password, age } = req.body; //Destructing 

      let user = await userModel.findOne({ email });// trace out is User already exist?

      if (user) return res.status(500).send("User already exists"); //if it is return and send the message 

      bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(password, salt, async (err, hash) => {
                  user = await userModel.create({
                        username,
                        name,
                        email,
                        password: hash,
                        age
                  });

                  let token = jwt.sign({ email: email, userid: user._id }, "ssshh");
                  res.cookie("token", token); //// token bhej rhe hai in the form of cookie
                  res.status(500).redirect('/login');
            });
      });
});



app.get('/login', (req, res) => {
      res.render('login');
});


app.post('/login', async (req, res) => {
      const { email, password } = req.body;
      let user = await userModel.findOne({ email });

      //check user present or not if not return and send message
      if (!user) return res.status(500).send("Invalid email or password");

      // To check paasword is correct or not 
      //password --> form k through wala , user.password ==> vo jo user create krte waqt jo set hai
      bcrypt.compare(password, user.password, (err, result) => {
            //if result true then we can login and cookie bhejna hai 
            //cookie dono case mai bhejna 
            if (result) {
                  let token = jwt.sign({ email: email, userid: user._id }, "ssshh");
                  res.cookie("token", token);
                  res.status(200).redirect("/profile");
            } else {
                  res.status(500).send("Invalid email or password");
            }
      });
});

app.get('/logout', (req, res) => {
      res.clearCookie("token");
      res.redirect('/login');
});

//user post tabhi likh paega jab vo logged in ho
app.post('/post', loggedIn, async (req, res) => {
      if (!req.user) return res.redirect('/login');

      let user = await userModel.findOne({ email: req.user.email });
      let { content } = req.body;

      //post ko create kr rhe hai
      let post = await postModel.create({
            user: user._id,
            content   // content profile.ejs k textarea se aaega 
      });

      // postmodel  k user ka type object id hai to usme posts naam k array mai post ki id daal di.
      user.posts.push(post._id);
      await user.save();
      res.redirect('/profile');

});

app.listen(3000, () => {
      console.log('Server running on port 3000');
});
