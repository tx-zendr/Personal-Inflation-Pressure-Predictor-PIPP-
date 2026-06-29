import uvicorn

if __name__ == "__main__":
    print("Starting Personal Inflation Rate Predictor API...")
    print("API will be accessible at: http://127.0.0.1:8000")
    print("API Docs: http://127.0.0.1:8000/docs")
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
