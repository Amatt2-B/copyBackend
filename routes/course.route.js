const express = require('express');
const filesController = require('../controllers/files.controller');

const router = express.Router();

const {
    getAllCourses,
    getCourse,
    createCourse,
    updateCourse,
    deleteCourse,
    inscriptionByCourse,
} = require(`${__dirname}/../controllers/course.controller.js`);
const fileParser = require('../utils/multipartParser');

router.route('/getInscriptions/:id').get(inscriptionByCourse);

router
    .route('/')
    .get(getAllCourses)
    .post(fileParser, filesController.formatCourseImage, createCourse);
router
    .route('/:id')
    .get(getCourse)
    .patch(
        filesController.uploadCourseImage,
        filesController.formatCourseImage,
        updateCourse
    )
    .delete(deleteCourse);

module.exports = router;
