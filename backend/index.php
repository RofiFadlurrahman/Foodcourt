<?php
session_start();

// Jika pengguna sudah login, alihkan otomatis ke dashboard masing-masing
if (isset($_SESSION['role'])) {
    if ($_SESSION['role'] === 'admin') {
        header("Location: admin/index.php");
        exit;
    } elseif ($_SESSION['role'] === 'tenant') {
        header("Location: tenant/index.php");
        exit;
    }
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CloudFood - Sistem Kasir & Manajemen Foodcourt</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        html, body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background: #f5efe4;
            color: #221a10;
            min-height: 100vh;
        }

        .shell {
            display: grid;
            grid-template-columns: 1.05fr 1fr;
            min-height: 100vh;
        }

        /* ---------- KIRI: konten editorial ---------- */
        .left {
            padding: 38px 56px 40px;
            display: flex;
            flex-direction: column;
            background: #f5efe4;
        }

        .topnav {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: auto;
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 11px;
            font-family: 'Fraunces', serif;
            font-weight: 600;
            font-size: 23px;
            letter-spacing: -0.5px;
            color: #221a10;
        }

        .logo .mark {
            width: 30px; height: 30px;
            background: #c2410c;
            border-radius: 8px;
            display: grid; place-items: center;
            color: #fff;
            font-family: 'Fraunces', serif;
            font-weight: 700;
            font-size: 17px;
        }

        .topnav .meta {
            font-size: 13px;
            color: #7a6b54;
            font-weight: 500;
        }
        .topnav .meta b { color: #221a10; }

        .hero-body {
            margin-top: 64px;
            margin-bottom: 44px;
            max-width: 520px;
        }

        .kicker {
            display: inline-flex;
            align-items: center;
            gap: 9px;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 1.6px;
            text-transform: uppercase;
            color: #c2410c;
            margin-bottom: 22px;
        }
        .kicker .line { width: 28px; height: 1px; background: #c2410c; }

        h1.title {
            font-family: 'Fraunces', serif;
            font-weight: 500;
            font-size: clamp(40px, 4.6vw, 58px);
            line-height: 1.02;
            letter-spacing: -1.8px;
            color: #221a10;
            margin-bottom: 20px;
        }
        h1.title .ital {
            font-style: italic;
            color: #c2410c;
            font-weight: 400;
        }

        .lede {
            font-size: 16px;
            line-height: 1.65;
            color: #5d513e;
            max-width: 460px;
            margin-bottom: 34px;
        }

        /* Kartu peran */
        .roles {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
            max-width: 540px;
        }

        .role {
            border: 1px solid #e2d6bf;
            background: #fffdf8;
            border-radius: 12px;
            padding: 20px 20px 18px;
            transition: border-color .2s ease, transform .2s ease;
        }
        .role:hover { border-color: #c9b79a; transform: translateY(-2px); }

        .role .num {
            font-family: 'Fraunces', serif;
            font-size: 14px;
            color: #b9a684;
            margin-bottom: 6px;
        }

        .role h3 {
            font-family: 'Fraunces', serif;
            font-weight: 600;
            font-size: 22px;
            letter-spacing: -0.4px;
            color: #221a10;
            margin-bottom: 6px;
        }

        .role p {
            font-size: 13px;
            line-height: 1.55;
            color: #6f6049;
            margin-bottom: 16px;
            min-height: 56px;
        }

        .role .links { display: flex; flex-direction: column; gap: 8px; }

        .btn-solid, .btn-text {
            display: inline-flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            font-size: 14px;
            font-weight: 600;
            text-decoration: none;
            border-radius: 8px;
            padding: 11px 14px;
            transition: all .18s ease;
        }

        .btn-solid { background: #221a10; color: #fffdf8; }
        .btn-solid:hover { background: #000; color: #fff; }
        .role.admin .btn-solid { background: #5b21b6; }
        .role.admin .btn-solid:hover { background: #4c1d95; }
        .role.tenant .btn-solid { background: #c2410c; }
        .role.tenant .btn-solid:hover { background: #9a3412; }

        .btn-text {
            color: #5d513e;
            background: transparent;
            padding: 9px 4px;
        }
        .btn-text:hover { color: #221a10; }

        .arrow { font-family: serif; }

        /* Footer kiri */
        .foot {
            margin-top: auto;
            padding-top: 28px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            border-top: 1px solid #e2d6bf;
            color: #8a7c66;
            font-size: 12.5px;
        }
        .foot .stat { font-family: 'Fraunces', serif; color: #221a10; font-size: 15px; font-weight: 500; }

        /* ---------- KANAN: foto ---------- */
        .right {
            position: relative;
            background-image: url('assets/img/foodcourt.jpg');
            background-size: cover;
            background-position: center;
            min-height: 100vh;
        }

        .right::after {
            content: "";
            position: absolute; inset: 0;
            background: linear-gradient(180deg, rgba(34,26,16,0.25) 0%, transparent 30%, transparent 70%, rgba(34,26,16,0.35) 100%);
        }

        .photo-cap {
            position: absolute;
            left: 28px; bottom: 26px;
            color: #fff;
            z-index: 2;
            font-family: 'Fraunces', serif;
        }
        .photo-cap .big { font-size: 19px; font-weight: 500; letter-spacing: -0.3px; }
        .photo-cap .small { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; opacity: 0.85; margin-top: 3px; letter-spacing: 0.4px; }

        .badge-corner {
            position: absolute;
            top: 28px; right: 28px;
            z-index: 2;
            background: rgba(255, 253, 248, 0.92);
            backdrop-filter: blur(4px);
            padding: 9px 14px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 600;
            color: #221a10;
            display: inline-flex;
            align-items: center;
            gap: 7px;
        }
        .badge-corner .d {
            width: 7px; height: 7px; border-radius: 50%;
            background: #16a34a;
            box-shadow: 0 0 0 3px rgba(22,163,74,0.25);
        }

        /* ---------- responsif ---------- */
        @media (max-width: 980px) {
            .shell { grid-template-columns: 1fr; }
            .right { min-height: 320px; order: -1; }
            .left { padding: 28px 24px 32px; }
            .hero-body { margin-top: 36px; }
            .roles { grid-template-columns: 1fr; }
            .role p { min-height: auto; }
        }
    </style>
</head>
<body>

<div class="shell">

    <!-- KIRI -->
    <main class="left">
        <nav class="topnav">
            <div class="logo"><span class="mark">C</span> CloudFood</div>
            <div class="meta">Pilih peran untuk <b>masuk</b></div>
        </nav>

        <section class="hero-body">
            <span class="kicker"><span class="line"></span>Sistem Kasir Foodcourt</span>
            <h1 class="title">Satu sistem untuk <span class="ital">setiap outlet</span> foodcourt Anda.</h1>
            <p class="lede">CloudFood menyatukan kasir POS, manajemen menu, dan pelaporan transaksi dari seluruh tenant — dalam satu tempat yang ringan dan mudah dijalankan.</p>

            <div class="roles">
                <div class="role admin">
                    <div class="num">01</div>
                    <h3>Admin</h3>
                    <p>Kelola tenant, menu, transaksi global, dan laporan berkala foodcourt.</p>
                    <div class="links">
                        <a href="admin/login.php" class="btn-solid">Masuk Admin <span class="arrow">→</span></a>
                        <a href="admin/register.php" class="btn-text">Daftar akun baru <span class="arrow">↗</span></a>
                    </div>
                </div>

                <div class="role tenant">
                    <div class="num">02</div>
                    <h3>Tenant</h3>
                    <p>Kelola menu outlet, input penjualan kasir POS, pantau transaksi hari ini.</p>
                    <div class="links">
                        <a href="tenant/login.php" class="btn-solid">Masuk Tenant <span class="arrow">→</span></a>
                        <a href="tenant/register.php" class="btn-text">Daftar akun baru <span class="arrow">↗</span></a>
                    </div>
                </div>
            </div>
        </section>

        <footer class="foot">
            <div>
                <div class="stat">CloudFood</div>
                <div>© <?= date('Y') ?> · Sistem Foodcourt</div>
            </div>
            <div style="text-align:right">
                POS · Menu · Laporan<br>
                <span style="color:#b9a684">v1.0</span>
            </div>
        </footer>
    </main>

    <!-- KANAN -->
    <aside class="right">
        <div class="badge-corner"><span class="d"></span> Aktif</div>
        <div class="photo-cap">
            <div class="big">Foodcourt, dirawat dalam satu sistem.</div>
            <div class="small">FOTO · AREA MAKAN TENANT</div>
        </div>
    </aside>

</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
