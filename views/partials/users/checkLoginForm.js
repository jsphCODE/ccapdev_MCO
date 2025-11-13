$(document).ready(function () {
  $('#loginProfile').on('submit', function (e) {
    e.preventDefault();
    $('#loginMsg').empty();
    clearErrors();

    const errors = [];

    const username = $('#username').val().trim();
    const email = $('#email').val().trim();
    const password = $('#password').val().trim();
    const confirmPassword = $('#confirmPassword').val().trim();

    // Validation rules
    if (!/^[a-zA-Z0-9]{4,}$/.test(username)) {
      errors.push('Username must be at least 4 characters and contain only letters and numbers.');
      showError('#username');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Please enter a valid email address.');
      showError('#email');
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password)) {
      errors.push('Password must be at least 8 characters and include uppercase, lowercase, number, and special character.');
      showError('#password');
    }

    if (password !== confirmPassword) {
      errors.push('Passwords do not match.');
      showError('#confirmPassword');
    }

    // Output result
    if (errors.length > 0) {
      $('#loginMsg').html(`<div class="error">${errors.join('<br>')}</div>`);
    } else {
      $('#loginMsg').html('<div class="success">Login successful!</div>');
      this.submit();
    }
  });

  function showError(selector) {
    $(selector).css('border-color', 'red');
  }

  function clearErrors() {
    $('#loginProfile input, #loginProfile select').css('border-color', '');
  }
});