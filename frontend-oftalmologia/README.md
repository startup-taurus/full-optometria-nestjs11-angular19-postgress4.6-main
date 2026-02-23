# Plantilla Base Angular 19

Este proyecto fue generado con [Angular CLI](https://github.com/angular/angular-cli) versión 19.0.0.

## Instalación

Para instalar las dependencias del proyecto, ejecuta:

```bash
npm install --force
```

El flag `--force` es necesario debido a algunas dependencias que requieren versiones específicas.

## Servidor de desarrollo

Ejecuta `ng serve` para iniciar el servidor de desarrollo. Navega a `http://localhost:4200/`. La aplicación se recargará automáticamente si cambias alguno de los archivos fuente.

## Estructura del proyecto

```
src/
├── app/
│   ├── core/                 # Servicios singleton, modelos, guards, etc.
│   │   ├── guards/
│   │   ├── helpers/
│   │   ├── interceptors/
│   │   ├── interfaces/
│   │   ├── services/
│   │   └── states/          # Estado global (NgRx)
│   │
│   ├── features/            # Módulos de características
│   │   ├── auth/
│   │   └── dashboards/
│   │
│   └── shared/             # Componentes, pipes y directivas compartidas
│       ├── components/
│       ├── directives/
│       └── pipes/
│
├── assets/
│   ├── i18n/               # Archivos de traducción
│   ├── images/
│   └── scss/              # Estilos globales
│
└── environments/          # Configuraciones por ambiente
```

## Traducciones

El sistema de traducción utiliza archivos JSON en la carpeta `src/assets/i18n/`.

1. Escribe las traducciones en inglés en `en.json`
2. Ejecuta el siguiente comando para generar automáticamente las traducciones en los demás idiomas:

```bash
npm run translate
```

Este comando traducirá automáticamente el contenido a los idiomas configurados (es, de, fr, etc.).

## Ayuda adicional

Para obtener más ayuda sobre Angular CLI usa `ng help` o consulta la [Documentación de Angular CLI](https://angular.dev/tools/cli).
