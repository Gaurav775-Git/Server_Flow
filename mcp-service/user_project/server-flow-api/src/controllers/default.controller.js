exports.handler = async (req, res, next) => {
  try {
    res.json({
      message: 'Success',
      data: req.body
    });
  } catch (error) {
    next(error);
  }
};

exports.handler = async (req, res, next) => {
  try {
    res.json({
      message: 'Success',
      data: req.body
    });
  } catch (error) {
    next(error);
  }
};
