---
title: Kubelab Stack deploy yaml
created: '2024-10-27T20:42:31.073Z'
modified: '2024-10-28T07:03:37.521Z'
---

# Kubelab Stack deploy yaml

## Nginx

```
{\"networks\":{\"traefik-proxy\":{\"external\":true}},\"services\":{\"test\":{\"image\":\"nginx:latest\",\"networks\":[\"traefik-proxy\"],\"deploy\":{\"labels\":[\"traefik.enable=true\",\"traefik.http.routers.CHANGEME.rule=Host(`SUBDOMAIN.kubelab.dk`)\",\"traefik.http.routers.CHANGEME.entrypoints=web,websecure\",\"traefik.http.routers.CHANGEME.tls.certresolver=letsencrypt\",\"traefik.http.services.CHANGEME.loadbalancer.server.port=80\"]}}}}
```

## WordPress

```
networks:\n  traefik-proxy:\n    external: true\n  wp-network:\n    driver: overlay\nservices:\n  wordpress:\n    image: wordpress:latest\n    environment:\n      WORDPRESS_DB_HOST: db\n      WORDPRESS_DB_USER: wpuser\n      WORDPRESS_DB_PASSWORD: wppassword\n      WORDPRESS_DB_NAME: wpdatabase\n    networks:\n      - traefik-proxy\n      - wp-network\n    deploy:\n      labels:\n        - traefik.enable=true\n        - traefik.http.routers.CHANGEME01.rule=Host(`SUBDOMAIN01.kubelab.dk`)\n        - traefik.http.routers.CHANGEME01.entrypoints=web,websecure\n        - traefik.http.routers.CHANGEME01.tls.certresolver=letsencrypt\n        - traefik.http.services.CHANGEME01.loadbalancer.server.port=80\n  db:\n    image: mariadb:latest\n    environment:\n      MYSQL_ROOT_PASSWORD: rootpassword\n      MYSQL_DATABASE: wpdatabase\n      MYSQL_USER: wpuser\n      MYSQL_PASSWORD: wppassword\n    networks:\n      - wp-network\n  phpmyadmin:\n    image: phpmyadmin:latest\n    environment:\n      PMA_HOST: db\n      PMA_USER: wpuser\n      PMA_PASSWORD: wppassword\n    networks:\n      - traefik-proxy\n      - wp-network\n    deploy:\n      labels:\n        - traefik.enable=true\n        - traefik.http.routers.CHANGEME02.rule=Host(`SUBDOMAIN02.kubelab.dk`)\n        - traefik.http.routers.CHANGEME02.entrypoints=web,websecure\n        - traefik.http.routers.CHANGEME02.tls.certresolver=letsencrypt\n        - traefik.http.services.CHANGEME02.loadbalancer.server.port=80
```

```yml
services:
  wordpress:
    image: wordpress:latest
    environment:
      WORDPRESS_DB_HOST: db
      WORDPRESS_DB_USER: wpuser
      WORDPRESS_DB_PASSWORD: wppassword
      WORDPRESS_DB_NAME: wpdatabase
    networks:
      - traefik-proxy
      - wp-network
    deploy:
      labels:
        - "traefik.enable=true"
        - "traefik.http.routers.CHANGEME01.rule=Host(SUBDOMAIN01.kubelab.dk)"
        - "traefik.http.routers.CHANGEME01.entrypoints=web,websecure"
        - "traefik.http.routers.CHANGEME01.tls.certresolver=letsencrypt"
        - "traefik.http.services.CHANGEME01.loadbalancer.server.port=80"

  db:
    image: mariadb:latest
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: wpdatabase
      MYSQL_USER: wpuser
      MYSQL_PASSWORD: wppassword
    networks:
      - wp-network

  phpmyadmin:
    image: phpmyadmin:latest
    environment:
      PMA_HOST: db
      PMA_USER: wpuser
      PMA_PASSWORD: wppassword
    networks:
      - traefik-proxy
      - wp-network
    deploy:
      labels:
        - "traefik.enable=true"
        - "traefik.http.routers.CHANGEME02.rule=Host(SUBDOMAIN02.kubelab.dk)"
        - "traefik.http.routers.CHANGEME02.entrypoints=web,websecure"
        - "traefik.http.routers.CHANGEME02.tls.certresolver=letsencrypt"
        - "traefik.http.services.CHANGEME02.loadbalancer.server.port=80"
```
