namespace VirtualArtGallery.Application.Common;

/// <summary>
/// A Railway-Oriented result wrapper that avoids throwing exceptions for expected
/// business failures (e.g. "Email already in use", "Artwork not found").
///
/// Usage:
///   var result = await _authService.RegisterAsync(dto);
///   if (!result.IsSuccess) return BadRequest(result.Error);
///   return Ok(result.Value);
/// </summary>
public class Result<T>
{
    public bool IsSuccess { get; }
    public T? Value { get; }
    public string? Error { get; }
    public int StatusCode { get; }

    private Result(T value)
    {
        IsSuccess = true;
        Value = value;
        StatusCode = 200;
    }

    private Result(string error, int statusCode)
    {
        IsSuccess = false;
        Error = error;
        StatusCode = statusCode;
    }

    public static Result<T> Success(T value) => new(value);

    public static Result<T> Failure(string error, int statusCode = 400) => new(error, statusCode);

    public static Result<T> NotFound(string error = "Resource not found.") => new(error, 404);

    public static Result<T> Unauthorized(string error = "Unauthorized.") => new(error, 401);

    public static Result<T> Forbidden(string error = "Access denied.") => new(error, 403);
}

/// <summary>Non-generic variant for void operations.</summary>
public class Result
{
    public bool IsSuccess { get; }
    public string? Error { get; }
    public int StatusCode { get; }

    private Result(bool success, string? error = null, int statusCode = 200)
    {
        IsSuccess = success;
        Error = error;
        StatusCode = statusCode;
    }

    public static Result Success() => new(true);
    public static Result Failure(string error, int statusCode = 400) => new(false, error, statusCode);
    public static Result NotFound(string error = "Resource not found.") => new(false, error, 404);
}
