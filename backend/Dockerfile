FROM php:8.2-cli

# Install PDO MySQL extension
RUN docker-php-ext-install pdo pdo_mysql

WORKDIR /app

COPY . .

CMD php -S 0.0.0.0:${PORT:-8080} -t .
