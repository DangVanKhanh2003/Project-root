server {
    listen 80;
    server_name ytmp4.gg www.ytmp4.gg;
    
    root  /var/www/KhanhHAUI/CICD/run/ytmp4.gg;
    index index.html;
    
    add_header X-VHost ytmp4.gg always;

    # Canonical cho /index(.html) – chỉ khi CLIENT thật sự gõ /index
    if ($request_uri ~* ^/index(?:\.html)?$) { return 301 /; }
    if ($request_uri ~* ^(/.+)/index(?:\.html)?$) { return 301 $1/; }

    # --- Trang đặc biệt: GIỮ .html ---
    # 1) Phục vụ nguyên .html (ưu tiên tuyệt đối)
    location = /2ccd33d1-a14a-446c-a260-c713a4059bf4.html {
        try_files $uri =404;
        add_header Cache-Control "public, max-age=600";
    }
    # 2) Bản không đuôi → 301 về .html (tránh trùng lặp nội dung)
    location = /2ccd33d1-a14a-446c-a260-c713a4059bf4 {
        return 301 $scheme://$host$uri.html$is_args$args;
    }

    # --- IndexNow key file ---
    location = /cae2551e942a48a298b99fe18f9f5a77 {
     default_type text/plain;
     try_files $uri $uri.txt;
     add_header Cache-Control "public, max-age=600";
    }


    # robots.txt riêng
    location = /robots.txt {
        alias  /var/www/KhanhHAUI/CICD/run/ytmp4.gg/robots.txt;
        access_log off;
        log_not_found off;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }



    # --- Redirect underscore -> hyphen (SEO canonical) ---
    location = /youtube_multi_downloader {
        return 301 $scheme://$host/youtube-multi-downloader$is_args$args;
    }
    location = /youtube_laylist_downloader {
        return 301 $scheme://$host/youtube-playlist-downloader$is_args$args;
    }

    # Nếu có ai gõ kèm .html thì cũng redirect luôn (tuỳ bạn có cần không)
    location = /youtube_multi_downloader.html {
        return 301 $scheme://$host/youtube-multi-downloader$is_args$args;
    }
    location = /youtube_laylist_downloader.html {
        return 301 $scheme://$host/youtube-playlist-downloader$is_args$args;
    }

    # /youtube_playlist_downloader  -> /youtube-playlist-downloader
    location = /youtube_playlist_downloader {
     return 301 $scheme://$host/youtube-playlist-downloader$is_args$args;
    }
    location = /youtube_playlist_downloader.html {
     return 301 $scheme://$host/youtube-playlist-downloader$is_args$args;
    
    }

    # Xử lý chính (SPA) + strip .html CHO CÁC TRANG KHÁC
    location / {
        # Strip .html trừ index.html và TRỪ trang đặc biệt
        rewrite ^/(?!2ccd33d1-a14a-446c-a260-c713a4059bf4\.html$)(?!.*?/index\.html$)(.+)\.html$ /$1 permanent;

        try_files $uri $uri.html $uri/index.html =404;
    }

    # Cache file tĩnh
    location ~* \.(mp4|woff|woff2|ttf|jpg|jpeg|gif|png|ico|css|json|js|swf|svg|dmg|webp|apk)$ {
        access_log off;
        log_not_found off;
        expires 7d;
        add_header Cache-Control "public, max-age=604800, immutable";
        add_header Access-Control-Allow-Origin "*" always;   
	add_header Vary "Origin" always; 
   }

   error_page 404 =301 /404.html;

   location = /404.html {
    # root LÀ FOLDER chứa file 404.html
    root /var/www/KhanhHAUI/CICD/run/v1.ytmp3.gg;
    try_files /404.html =404;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
   }

    absolute_redirect off;
    server_name_in_redirect off;
}

