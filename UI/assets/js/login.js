async function login() {
    var username = document.getElementById("username").value.trim();
    var password = document.getElementById("password").value.trim();
    const errorMessage = document.getElementById('error-message');

    if (username === "" || password === "") {
      alert("Please enter user name or password");
      return false;
    } else {
        try {
            const response = await fetch(api_url +"/login", {
                method: "POST",
                // headers: {
                //     "Accept": "application/json",
                //     "Content-Type": "application/json"
                // },
                // body: JSON.stringify({
                //     username: username,
                //     password: password
                // })
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                    },
                    body: new URLSearchParams({
                    username: username,
                    password: password
                    })

            });

            const data = await response.json();
            if (data.success) {
                localStorage.setItem('authToken',data.access_token)
                window.location.href = 'index.html';
            } else { 
                localStorage.removeItem('authToken')
                errorMessage.textContent = data.message || 'Invalid login credentials.';
            }

            return true;      
        } catch (error) {
            console.error("Error:", error);
            errorMessage.textContent = 'An error occurred. Please try again later.';
            return false;
        }

    }
  }

document.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        login();
    }
});