//Also checks the 'edit profile' form, since it uses the same form
$(document).ready(function () {
  $('#registerProfile').on('submit', function (e) {
    e.preventDefault();
    $('#registerMsg').empty();
    clearErrors();

    const errors = [];

    const firstName = $('#firstName').val().trim();
    const lastName = $('#lastName').val().trim();
    const email = $('#email').val().trim();
    const phone = $('#phone').val().trim();
    const username = $('#username').val().trim();
    const password = $('#password').val().trim();
    const confirmPassword = $('#confirmPassword').val().trim();
    const role = $('#role').val();

    // Validation rules
    if (!/^[a-zA-Z]{2,}$/.test(firstName)) {
      errors.push('First name must be at least 2 letters and contain only letters.');
      showError('#firstName');
    }

    if (!/^[a-zA-Z]{2,}$/.test(lastName)) {
      errors.push('Last name must be at least 2 letters and contain only letters.');
      showError('#lastName');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Please enter a valid email address.');
      showError('#email');
    }

    if (phone && !/^(\(\d{3}\)|\d{3})[- ]?\d{3}[- ]?\d{4}$/.test(phone)) {
      errors.push('Please enter a valid phone number format (e.g. 123-456-7890).');
      showError('#phone');
    }

    if (!/^[a-zA-Z0-9]{4,}$/.test(username)) {
      errors.push('Username must be at least 4 characters and contain only letters and numbers.');
      showError('#username');
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
      $('#registerMsg').html(`<div class="error">${errors.join('<br>')}</div>`);
    } else {
      $('#registerMsg').html('<div class="success">Success!</div>');
      this.submit();
    }
  });

  function showError(selector) {
    $(selector).css('border-color', 'red');
  }

  function clearErrors() {
    $('#registerProfile input, #registerProfile select').css('border-color', '');
  }
});