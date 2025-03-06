resource "aws_lambda_function" "order_lambda" {
  function_name    = "order_lambda"
  filename         = "lambda.zip"
  source_code_hash = filebase64sha256("lambda.zip")
  role             = data.aws_iam_role.default.arn
  handler          = "dist/index.handler"
  runtime          = "nodejs18.x"

  vpc_config {
    subnet_ids         = [data.terraform_remote_state.network.outputs.lambda_private_subnet_id]
    security_group_ids = [data.terraform_remote_state.network.outputs.lambda_sg_id]
  }

  environment {
    variables = {
      SQS_URL = aws_sqs_queue.order_queue.url
    }
  }

  dead_letter_config {
    target_arn = aws_sqs_queue.order_queue_dlq.arn
  }
}

resource "aws_lambda_permission" "allow_sqs" {
  statement_id  = "AllowSQSToInvokeLambda"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.order_lambda.function_name
  principal     = "sqs.amazonaws.com"
  source_arn    = aws_sqs_queue.order_queue.arn
}

resource "aws_lambda_event_source_mapping" "sqs_to_lambda_with_dlq" {
  event_source_arn  = aws_sqs_queue.order_queue.arn
  function_name     = aws_lambda_function.order_lambda.function_name
  batch_size        = 5
  enabled           = true
}