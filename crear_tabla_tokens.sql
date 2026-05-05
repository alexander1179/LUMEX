CREATE TABLE IF NOT EXISTS registro_tokens (
    id_registro INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    email VARCHAR(255),
    tipo_evento VARCHAR(50),
    hora_envio DATETIME,
    estado_sesion VARCHAR(50) NULL,
    fecha_cierre DATETIME NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
