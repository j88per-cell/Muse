<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <title>{{ $book->title }}</title>
        <style>
            @page {
                margin: 1.2in 1in;
            }
            body {
                font-family: Georgia, 'Times New Roman', serif;
                color: #1f1c16;
                font-size: 12pt;
                line-height: 1.6;
            }
            .book-title {
                text-align: center;
                font-size: 20pt;
                font-weight: bold;
                margin-bottom: 1.5rem;
            }
            .chapter {
                page-break-before: always;
            }
            .chapter:first-child {
                page-break-before: avoid;
            }
            .chapter-label {
                text-align: center;
                font-size: 9pt;
                letter-spacing: 0.35em;
                text-transform: uppercase;
                color: #7b7266;
                margin: 0 0 0.5rem 0;
            }
            .chapter-title {
                text-align: center;
                font-size: 20pt;
                font-weight: bold;
                margin: 0 0 2.2rem 0;
            }
            .chapter-body p {
                margin: 0 0 0.9rem 0;
            }
        </style>
    </head>
    <body>
        <div class="book-title">{{ $book->title }}</div>

        @foreach ($book->chapters as $chapter)
            <section class="chapter">
                <p class="chapter-label">Chapter {{ $chapter->position + 1 }}</p>
                <h2 class="chapter-title">{{ $chapter->title }}</h2>
                <div class="chapter-body">
                    @foreach (preg_split("/\\r?\\n/", trim($chapter->content ?? '')) as $paragraph)
                        @if (strlen(trim($paragraph)) > 0)
                            <p>{{ $paragraph }}</p>
                        @endif
                    @endforeach
                </div>
            </section>
        @endforeach
    </body>
</html>
