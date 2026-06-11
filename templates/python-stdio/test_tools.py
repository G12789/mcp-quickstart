from datetime import datetime

import tools


def test_text_stats_counts_words_and_characters():
    stats = tools.text_stats("hello world")
    assert stats["words"] == 2
    assert stats["characters"] == 11
    assert stats["characters_no_spaces"] == 10


def test_text_stats_counts_sentences():
    stats = tools.text_stats("One. Two! Three?")
    assert stats["sentences"] == 3


def test_text_stats_handles_empty():
    assert tools.text_stats("   ")["words"] == 0


def test_ping_returns_pong():
    result = tools.ping()
    assert result["message"] == "pong"
    # Should be a valid ISO timestamp.
    datetime.fromisoformat(result["timestamp"])


def test_greeting_falls_back_to_world():
    assert "Hello, world!" in tools.greeting("")
    assert "Hello, Ada!" in tools.greeting("Ada")
