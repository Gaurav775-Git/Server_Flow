var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var { query } = require("./config/db"); //   Correct import
var userRoutes = require("./routes/userRoute");
var indexRouter = require("./routes/index");
var authRoutes = require("./routes/authRoutes");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/api/auth", authRoutes);
// app.use("/api/users", userRoutes);

//   FIXED: Test route
app.get("/test", async (req, res) => {
  try {
    const result = await query("SELECT NOW() as time");
    res.json({
      //   Changed from req.json to res.json
      success: true,
      message: "  Database connected!",
      time: result.rows[0].time, //   Changed from result.row to result.rows
    });
  } catch (err) {
    //   Changed from 'error' to 'err'
    console.error("Query error:", err);
    res.status(500).json({
      success: false,
      error: err.message, //   Changed from error.message to err.message
    });
  }
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
