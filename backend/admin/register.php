<?php
session_start();

// Jika sudah login sebagai admin, alihkan ke dashboard
if (isset($_SESSION['role']) && $_SESSION['role'] === 'admin') {
    header("Location: index.php");
    exit;
}

$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_once '../db.php';
    
    $usernameInput = trim($_POST['username'] ?? '');
    $passwordInput = trim($_POST['password'] ?? '');
    $confirmPasswordInput = trim($_POST['confirm_password'] ?? '');
    
    if ($usernameInput !== '' && $passwordInput !== '' && $confirmPasswordInput !== '') {
        if ($passwordInput !== $confirmPasswordInput) {
            $error = 'Konfirmasi password tidak cocok!';
        } elseif (strlen($passwordInput) < 6) {
            $error = 'Password minimal harus 6 karakter!';
        } else {
            try {
                // Periksa apakah username sudah ada
                $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM `users` WHERE `username` = ?");
                $stmtCheck->execute([$usernameInput]);
                if ($stmtCheck->fetchColumn() > 0) {
                    $error = 'Username sudah terpakai!';
                } else {
                    // Simpan user baru dengan hash bcrypt
                    $hashedPassword = password_hash($passwordInput, PASSWORD_BCRYPT);
                    $stmtInsert = $pdo->prepare("INSERT INTO `users` (`username`, `password`, `role`) VALUES (?, ?, 'admin')");
                    $stmtInsert->execute([$usernameInput, $hashedPassword]);
                    
                    $success = 'Pendaftaran Admin berhasil! Mengalihkan ke halaman masuk...';
                }
            } catch (PDOException $e) {
                $error = 'Terjadi kesalahan sistem: ' . $e->getMessage();
            }
        }
    } else {
        $error = 'Harap isi semua kolom pendaftaran!';
    }
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daftar Admin - Sistem Foodcourt</title>
    <!-- Bootstrap 5 CSS CDN -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: #060913;
            background-image: 
                radial-gradient(at 0% 0%, rgba(139, 92, 246, 0.15) 0px, transparent 50%),
                radial-gradient(at 100% 100%, rgba(99, 102, 241, 0.12) 0px, transparent 50%);
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            margin: 0;
        }

        .login-card {
            background: rgba(19, 27, 46, 0.6);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            padding: 40px;
            width: 100%;
            max-width: 420px;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
            animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .logo-box {
            display: inline-flex;
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(99, 102, 241, 0.2));
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 14px;
            align-items: center;
            justify-content: center;
            margin-bottom: 24px;
        }

        .logo-box svg {
            width: 32px;
            height: 32px;
            fill: #8b5cf6;
        }

        .text-title {
            color: #f8fafc;
            font-weight: 800;
            letter-spacing: -0.5px;
            margin-bottom: 4px;
        }

        .text-subtitle {
            color: #94a3b8;
            font-size: 13px;
            margin-bottom: 28px;
        }

        .form-label {
            color: #94a3b8;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .form-control {
            background-color: rgba(11, 15, 25, 0.8) !important;
            border: 1px solid rgba(255, 255, 255, 0.08);
            color: #f8fafc !important;
            padding: 10px 14px;
            font-size: 14px;
            border-radius: 8px;
        }

        .form-control:focus {
            border-color: #8b5cf6;
            box-shadow: 0 0 0 2.5px rgba(139, 92, 246, 0.25);
        }

        .btn-submit {
            background-color: #8b5cf6;
            border: none;
            color: white;
            padding: 12px;
            font-weight: 600;
            font-size: 15px;
            border-radius: 8px;
            transition: all 0.2s ease;
            margin-top: 10px;
        }

        .btn-submit:hover {
            background-color: #7c3aed;
        }

        .alert-custom {
            background-color: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.2);
            color: #fca5a5;
            font-size: 13px;
            border-radius: 8px;
            padding: 10px 14px;
            margin-bottom: 20px;
        }

        .alert-success-custom {
            background-color: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.2);
            color: #a7f3d0;
            font-size: 13px;
            border-radius: 8px;
            padding: 10px 14px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>

    <div class="login-card text-center">
        <div class="logo-box">
            <svg viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
        </div>

        <h3 class="text-title">Daftar Admin</h3>
        <p class="text-subtitle">Registrasi akun administrator baru</p>

        <?php if (!empty($error)): ?>
            <div class="alert alert-custom d-flex align-items-center gap-2" role="alert">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" class="flex-shrink-0">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>
                <div><?= htmlspecialchars($error); ?></div>
            </div>
        <?php endif; ?>

        <?php if (!empty($success)): ?>
            <div class="alert alert-success-custom d-flex align-items-center gap-2" role="alert">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" class="flex-shrink-0">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <div><?= htmlspecialchars($success); ?></div>
            </div>
            <script>
                setTimeout(function() {
                    window.location.href = 'login.php';
                }, 1500);
            </script>
        <?php endif; ?>

        <form action="" method="POST" novalidate>
            <div class="form-group text-start mb-3">
                <label for="username" class="form-label mb-1">Username Admin</label>
                <input type="text" class="form-control" id="username" name="username" placeholder="Buat username" required>
            </div>
            <div class="form-group text-start mb-3">
                <label for="password" class="form-label mb-1">Password</label>
                <input type="password" class="form-control" id="password" name="password" placeholder="Minimal 6 karakter" required>
            </div>
            <div class="form-group text-start mb-4">
                <label for="confirm_password" class="form-label mb-1">Konfirmasi Password</label>
                <input type="password" class="form-control" id="confirm_password" name="confirm_password" placeholder="Ulangi password" required>
            </div>
            <button type="submit" class="btn btn-submit w-100 mb-3" <?= !empty($success) ? 'disabled' : '' ?>>Daftar Sekarang</button>
        </form>

        <div class="mt-2 text-center" style="font-size: 13px;">
            <span class="text-muted">Sudah punya akun admin? </span>
            <a href="login.php" class="text-decoration-none" style="color: #a78bfa; font-weight: 600;">Masuk di sini</a>
        </div>
    </div>

    <!-- Bootstrap Bundle JS CDN -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
