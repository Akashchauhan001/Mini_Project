# Sample Papers

This directory is where you place PDF research papers for the ARID Platform.

## Included Sample Data

`sample_metadata.json` — Contains metadata for 3 landmark AI papers:
1. **Attention Is All You Need** (Vaswani et al., 2017)
2. **BERT** (Devlin et al., 2019)
3. **Deep Residual Learning** (He et al., 2016)

## How to Add Real PDFs

1. Download PDFs from [arXiv.org](https://arxiv.org), [Semantic Scholar](https://semanticscholar.org), or any academic source.
2. Place the PDF files in this `sample_papers/` directory.
3. Use the **Upload Paper** page in the ARID Platform UI.
4. Or, use the `seed_demo.py` script (see below) to bulk-import the metadata.

## Recommended Papers to Download (Free)

| Title | URL |
|-------|-----|
| Attention Is All You Need | https://arxiv.org/pdf/1706.03762 |
| BERT | https://arxiv.org/pdf/1810.04805 |
| GPT-3 | https://arxiv.org/pdf/2005.14165 |
| ResNet | https://arxiv.org/pdf/1512.03385 |
| Word2Vec | https://arxiv.org/pdf/1301.3781 |

## Seed Demo Data (Without PDFs)

To populate the platform with demo data without uploading PDFs, run:

```bash
cd backend
python seed_demo.py
```

This inserts the 3 sample papers into SQLite and builds the knowledge graph from metadata alone.
