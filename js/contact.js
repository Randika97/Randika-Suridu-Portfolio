$(document).ready(function(){
    
    (function($) {
        "use strict";

    
    jQuery.validator.addMethod('answercheck', function (value, element) {
        return this.optional(element) || /^\bcat\b$/.test(value)
    }, "type the correct answer -_-");

    // validate contactForm form
    $(function() {
        $('#contactForm').validate({
            rules: {
                name: {
                    required: true,
                    minlength: 2
                },
                subject: {
                    required: true,
                    minlength: 4
                },
                number: {
                    required: true,
                    minlength: 5
                },
                email: {
                    required: true,
                    email: true
                },
                message: {
                    required: true,
                    minlength: 20
                }
            },
            messages: {
                name: {
                    required: "come on, you have a name, don't you?",
                    minlength: "your name must consist of at least 2 characters"
                },
                subject: {
                    required: "come on, you have a subject, don't you?",
                    minlength: "your subject must consist of at least 4 characters"
                },
                number: {
                    required: "come on, you have a number, don't you?",
                    minlength: "your Number must consist of at least 5 characters"
                },
                email: {
                    required: "no email, no message"
                },
                message: {
                    required: "um...yea, you have to write something to send this form.",
                    minlength: "thats all? really?"
                }
            },
            submitHandler: function(form) {
                var $form = $(form);
                var $btn = $form.find('button[type="submit"]');
                var originalText = $btn.text();
                $form.find('.form-status').remove();
                $btn.prop('disabled', true).text('Sending...');
                $.ajax({
                    type: "POST",
                    url: "/api/contact",
                    contentType: "application/json",
                    data: JSON.stringify({
                        name: $form.find('#name').val(),
                        email: $form.find('#email').val(),
                        subject: $form.find('#subject').val(),
                        message: $form.find('#message').val()
                    }),
                    success: function() {
                        $btn.text('Message Sent');
                        $form[0].reset();
                        $('<div class="form-status alert alert-success mt-3" role="alert">Thank you! Your message has been sent. I will get back to you soon.</div>').insertAfter($btn.closest('.form-group'));
                    },
                    error: function(xhr) {
                        $btn.prop('disabled', false).text(originalText);
                        var msg = "Something went wrong. Please try again later.";
                        try { msg = JSON.parse(xhr.responseText).error || msg; } catch (e) {}
                        $('<div class="form-status alert alert-danger mt-3" role="alert"></div>').text(msg).insertAfter($btn.closest('.form-group'));
                    }
                });
            }
        })
    })
        
 })(jQuery)
})