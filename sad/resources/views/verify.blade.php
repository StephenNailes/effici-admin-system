<!DOCTYPE html>
<html>
<head>
    <title>Verify Your Email</title>
</head>
<body>
    <h1>Please Verify Your Email</h1>
    <p>A verification link has been sent to your email address.</p>
    <p>Once verified, you can <a href="{{ route('login') }}">log in here</a>.</p>
    <form method="POST" action="{{ route('verification.send') }}">
    @csrf
    <button type="submit">Resend Verification Email</button>
</form>

</body>
</html>
