def lambda_handler(event, context):
    try:
        # Verarbeitung des Ereignisses hier
        print('Received event:', event)

        # Rückgabe einer Antwort
        response = {
            'statusCode': 200,
            'body': 'Hello World from Lambda!'
        }

        return response
    except Exception as e:
        # Fehlerbehandlung
        print('Error:', e)

        # Rückgabe einer Fehlerantwort
        response = {
            'statusCode': 500,
            'body': 'An error occurred'
        }

        return response
