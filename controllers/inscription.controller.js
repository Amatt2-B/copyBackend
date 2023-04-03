const factory = require('./handlerFactory.controller');
const Inscription = require('../models/inscriptions.model');
const Course = require('../models/courses.model');
const catchAsync = require('../utils/catchAsync');
const Email = require('../utils/email');
const AppError = require('../utils/appError');

exports.getAllInscriptions = factory.getAll(Inscription, [
    { path: 'user', select: 'email name postalCode' },
    {
        path: 'course',
        select: 'courseName teachers modality description',
        populate: 'topics',
    },
]);
exports.getInscription = factory.getOne(Inscription, ['user', 'course']);

// TODO: CREATE CUSTOM MIDDLEWARE TO TAKE INTO ACCOUNT BUSINESS RULES
// 1 reduce or add to capacity of course
exports.createInscription = factory.createOne(Inscription);
exports.deleteInscription = factory.deleteOne(Inscription);

/* A function that is being exported. */
exports.inscribeTo = catchAsync(async (req, res, next) => {
    const courseId = req.body.courseId;
    if (!courseId) {
        return next(
            new AppError(
                'Envía la clave del curso para poderte inscribir.',
                400
            )
        );
    }

    const course = await Course.findById(courseId);
    if (!course) {
        return next(
            new AppError('No se encontró ningún curso con esta clave.', 404)
        );
    }

    if (course.cost > 0) {
        return next(
            new AppError(
                'Necesitas pagar por este curso! Inicia tu proceso de pago.',
                400
            )
        );
    }

    if (course.startDate < Date.now()) {
        return next(
            new AppError(
                'Este curso ya ha iniciado, no puedes inscribirte.',
                400
            )
        );
    }

    if (course.capacity == 0) {
        return next(
            new AppError('Ya no hay espacio disponible en este curso.', 400)
        );
    }

    // Check if this user has inscribed to this course
    const inscription = await Inscription.find({
        course: courseId,
        user: req.user._id,
    });
    if (inscription.length > 0) {
        return next(new AppError('Ya te has inscrito a este curso.', 400));
    }

    // Update course capacity
    course.capacity = course.capacity - 1;
    await course.save();

    await Inscription.create({
        course: courseId,
        user: req.user._id,
    });

    try {
        await new Email(
            req.user,
            process.env.LANDING_URL,
            course
        ).sendInscriptonAlert();
    } catch (error) {
        return next(
            new AppError(
                'Hemos tenido problemas enviando un correo de confirmación.',
                500
            )
        );
    }

    res.status(200).json({
        status: 'success',
        data: { document: course },
    });
});

/* A function that is being exported. */
exports.myInscriptions = catchAsync(async (req, res, next) => {
    const inscriptions = await Inscription.find({
        user: req.user._id,
    })
        .populate(['course'])
        .sort({ updatedAt: -1 }); // most recent courses first

    res.status(200).json({
        status: 'success',
        results: inscriptions.length,
        data: { document: inscriptions },
    });
});
