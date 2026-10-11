def chunk_text(
    text: str,
    chunk_size: int = 500,
    overlap: int = 50
) -> list[str]:
    """
    Split text into chunks without cutting words in half.
    """

    words = text.split()

    chunks = []
    current_chunk = []
    current_length = 0

    for word in words:

        word_length = len(word) + 1

        if current_chunk and current_length + word_length > chunk_size:
            chunks.append(" ".join(current_chunk))

            # Keep some words for overlap
            overlap_words = []
            overlap_length = 0

            for previous_word in reversed(current_chunk):
                if overlap_length + len(previous_word) + 1 > overlap:
                    break

                overlap_words.insert(0, previous_word)
                overlap_length += len(previous_word) + 1

            current_chunk = overlap_words
            current_length = overlap_length

        current_chunk.append(word)
        current_length += word_length

    if current_chunk:
        chunks.append(" ".join(current_chunk))

    return chunks