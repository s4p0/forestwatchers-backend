from app import app
from flask.ext.httpauth import HTTPBasicAuth

auth = HTTPBasicAuth()

@app.route('/<string:username>')
@auth.login_required
def user(username):
    return app.send_static_file('user.html')


users = {
    "john": "hello",
    "susan": "bye"
}

@auth.get_password
def get_pw(username):
    if username in users:
        return users.get(username)
    return None