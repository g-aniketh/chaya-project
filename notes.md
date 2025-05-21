# Notes

This will consist of any information regarding developement or architecture

1. Creating sym ling for env so that its used globally:

```
ln -sf ../../.env packages/shared/.env
```

2. Docker command to run postgres image with port mapping

```
docker run --name chaya-postgres -e POSTGRES_PASSWORD=yourpassword -e POSTGRES_USER=chaya -e POSTGRES_DB=chaya_app -p 5432:5432 -d postgres:14
```

DATABASE_URL="postgresql://chaya:yourpassword@localhost:5432/chaya_app?schema=public" (this can be used to generate)
