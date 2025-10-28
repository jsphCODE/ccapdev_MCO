// Not currently in use
$(function () {
    $('#registerBtn').on('click', function () {
        const password = $('#password').val();
        const confirmPassword = $('#confirmPassword').val();

        let errors = [];

        if (password !== confirmPassword) errors.push('Confirm Password does not match with Password.');

        if (errors.length > 0) {
            $('#registerMsg').html('<div class="alert alert-danger">' + errors.join('<br>') +'</div>');
        } else {
            $('#registerMsg').html('<div class="alert alert-success">Registration successful! Proceed below to see your profile.</div>');
        }
    });
});
